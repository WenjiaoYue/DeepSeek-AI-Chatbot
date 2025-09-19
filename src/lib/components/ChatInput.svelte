<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { Send, Mic, Square } from "lucide-svelte";

  const dispatch = createEventDispatcher<{ send: string }>();
  export let disabled = false;

  let message = "";
  let textarea: HTMLTextAreaElement;
  let showCounter = false;

  // ===== 语音识别：状态细分 =====
  let recognition: any = null;
  let micSupported = false;

  // 三种状态
  let isStarting = false;     // 已点开始，等待 onstart
  let isRecording = false;    // onstart 之后
  let isProcessing = false;   // 按下停止到拿到最终文本这段
  let partialText = "";      // 展示“实时识别(临时)”

  // 点击切换模式下不需要循环重启
  let shouldLoop = false;

  let recordingTimeout: number | undefined;
  let processingTimeout: number | undefined;
  const MAX_RECORDING_MS = 60_000; // 1 分钟自动停止
  const MAX_PROCESSING_MS = 4000;  // 停止后最多等待 4s

  let voiceHint = ""; // 仅显示错误/超时

  const MAX_HEIGHT_PX = 80;

  function getLineHeight() {
    return parseInt(getComputedStyle(textarea).lineHeight || "24", 10) || 24;
  }

  function setInitialHeight() {
    if (!textarea) return;
    const lh = getLineHeight();
    textarea.style.height = `${lh}px`; // 默认单行
    textarea.style.overflowY = "hidden";
    showCounter = false;
  }

  function autoResize() {
    if (!textarea) return;
    const lh = getLineHeight();
    textarea.style.height = "auto";
    const scrollH = textarea.scrollHeight;
    const newH = Math.min(Math.max(lh, scrollH), MAX_HEIGHT_PX);
    textarea.style.height = `${newH}px`;
    textarea.style.overflowY = newH >= MAX_HEIGHT_PX ? "auto" : "hidden";
    showCounter = scrollH > lh * 2.5;
  }

  function handleInput() {
    if (message.length > 256) message = message.substring(0, 256);
    autoResize();
  }

  function sendMessage() {
    console.log('发送');
    
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    dispatch("send", trimmed);
    message = "";
    partialText = "";
    requestAnimationFrame(() => setInitialHeight());
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  }

  // ===== 语音识别：初始化与事件 =====
  function initVoice() {
    try {
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) {
        micSupported = false;
        return;
      }
      recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "zh-CN";

      recognition.onstart = () => {
        // 真正开始录音
        isStarting = false;
        isRecording = true;
        isProcessing = false;
        clearTimeout(processingTimeout);
      };

      recognition.onresult = (event: any) => {
        // 展示临时结果 + 最终结果
        const res = event.results;
        const last = res[event.resultIndex];
        const transcript = Array.from(res)
          .map((r: any) => r[0]?.transcript || "")
          .join("");

        if (last?.isFinal) {
          // 拿到最终文本
          partialText = "";
          message = transcript.slice(0, 256);
          isProcessing = false;
          autoResize();
        } else {
          // 临时文本放到 partial 展示
          partialText = transcript.slice(0, 256);
        }
      };

      recognition.onerror = (e: any) => {
        // 常见：no-speech / not-allowed / audio-capture
        stopRecordingInternal(false); // 不进入 processing
        voiceHint = `语音识别错误：${e?.error || "未知错误"}`;
        setTimeout(() => (voiceHint = ""), 2500);
        console.error("语音识别错误:", e);
      };

      recognition.onend = () => {
        if (shouldLoop) {
          // 连续模式才会重启；点击切换不会设置 shouldLoop
          try { recognition?.start(); } catch {}
        } else {
          // 用户主动停止 -> 进入“转写中”
          if (!isRecording && !isStarting) {
            if (!message.trim() && !partialText) {
              // 没有结果时也给个短暂 processing 提示，防止空窗
              isProcessing = true;
            }
            // 兜底最晚结束“转写中”
            clearTimeout(processingTimeout);
            processingTimeout = window.setTimeout(() => {
              isProcessing = false;
            }, MAX_PROCESSING_MS);
          }
        }
      };
    } catch (err) {
      micSupported = false;
      console.error("初始化语音识别失败:", err);
    }
  }

  // ===== 点击切换 =====
  function toggleRecording() {
    if (!recognition || disabled) return;
    if (isRecording || isStarting) {
      shouldLoop = false;
      stopRecordingInternal(true);
    } else {
      shouldLoop = false; // 点击切换：不自动重启
      startRecordingInternal();
    }
  }

  function startRecordingInternal() {
    partialText = "";
    isStarting = true;
    isProcessing = false;
    clearTimeout(processingTimeout);
    try { recognition.start(); } catch {}

    // 最大录音时长（点击切换也要生效）
    clearTimeout(recordingTimeout);
    recordingTimeout = window.setTimeout(() => {
      shouldLoop = false;
      stopRecordingInternal(true);
      voiceHint = "已达到最大录音时间 1 分钟";
      setTimeout(() => (voiceHint = ""), 2000);
    }, MAX_RECORDING_MS);
  }

  function stopRecordingInternal(enterProcessing: boolean) {
    if (!recognition) return;
    clearTimeout(recordingTimeout);
    shouldLoop = false;
    isStarting = false;
    isRecording = false;

    // 停止后进入“转写中”视觉反馈（等最终结果）
    if (enterProcessing) {
      isProcessing = true;
      clearTimeout(processingTimeout);
      processingTimeout = window.setTimeout(() => {
        isProcessing = false;
      }, MAX_PROCESSING_MS);
    } else {
      isProcessing = false;
    }

    try { recognition.stop(); } catch {}
  }

  // 页面隐藏时仅在“真正录音中”才停止，避免启动期被打断
  function handleVisibility() {
    if (document.hidden && isRecording) {
      shouldLoop = false;
      stopRecordingInternal(false);
    }
  }

  onMount(() => {
    setInitialHeight();
    if (typeof window !== "undefined") {
      initVoice();
      document.addEventListener("visibilitychange", handleVisibility);
    }
  });
</script>

<div class="input-section px-4 flex justify-center">
  <div class="w-full max-w-2xl">
    <div
      class="chat-input-surface relative w-full rounded-3xl px-1 py-1
             bg-gray-600/5 dark:bg-gray-400/5 dark:text-gray-100
             border border-gray-300 transition-all"
    >
      <!-- 移动端/桌面：点击切换录音 -->
      {#if micSupported}
        <button
          type="button"
          on:click|preventDefault={toggleRecording}
          disabled={disabled}
          class="absolute -top-6 left-3 h-10 w-10 rounded-full
                 bg-blue-600 text-white shadow-lg md:hidden select-none
                 active:scale-95 transition disabled:bg-gray-400
                 flex items-center justify-center z-10 touch-none"
          aria-label={isRecording || isStarting ? "停止录音" : "开始录音"}
          title="点击开始/停止录音"
        >
          {#if isRecording || isStarting}
            <Square size={16} />
          {:else}
            <Mic size={16} />
          {/if}
        </button>
      {/if}

      <!-- 主行：左麦克风（桌面点击切换） + 文本域 + 发送 -->
      <div class="flex items-center relative w-full min-h-12">
        {#if micSupported}
          <button
            type="button"
            on:click|preventDefault={toggleRecording}
            disabled={disabled}
            class="hidden md:flex ml-2 h-8 w-8 items-center justify-center
                   text-gray-600 rounded-md transition active:scale-95
                   hover:text-gray-800 disabled:text-gray-400"
            aria-label={isRecording || isStarting ? "停止录音" : "开始录音"}
            title="点击开始/停止录音"
          >
            {#if isRecording || isStarting}
              <Square size={18} />
            {:else}
              <Mic size={18} />
            {/if}
          </button>
        {/if}

        <div class="relative flex-1 min-w-0">
          <textarea
            bind:this={textarea}
            bind:value={message}
            on:input={handleInput}
            on:keydown={handleKeyDown}
            {disabled}
            rows="1"
            class="block w-full bg-transparent px-4 py-3 outline-none resize-none
                   focus:outline-none focus:ring-0 focus:shadow-none text-[#000]
                   border-none leading-[1.25] min-h-0 pr-12
                   [scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.35)_transparent]
                   dark:[scrollbar-color:rgba(255,255,255,0.35)_transparent]"
            style="box-sizing: content-box; scrollbar-gutter: stable both-edges; overscroll-behavior: contain;"
            placeholder={partialText ? partialText : (isStarting ? "正在启动麦克风…" : (isRecording ? "正在聆听…" : ""))}
          />

          <!-- 右下角状态：启动中 / 录音中 / 转写中 -->
          {#if isStarting}
            <div class="absolute right-2 bottom-2 flex items-center px-1.5 py-0.5 rounded
                        bg-black/5 dark:bg-white/10">
              <span class="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              <span class="ml-1 text-xs opacity-80">启动中</span>
            </div>
          {:else if isRecording}
            <div class="absolute right-2 bottom-2 flex items-center px-1.5 py-0.5 rounded
                        bg-black/5 dark:bg-white/10">
              <span class="relative inline-flex">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <span class="absolute inline-flex w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              </span>
              <span class="ml-1 text-xs opacity-80">录音中</span>
            </div>
          {:else if isProcessing}
            <div class="absolute right-2 bottom-2 flex items-center px-1.5 py-0.5 rounded
                        bg-black/5 dark:bg-white/10">
              <span class="flex items-center">
                <span class="w-1 h-1 rounded-full bg-current animate-bounce"></span>
                <span class="w-1 h-1 rounded-full bg-current mx-1 [animation-delay:120ms] animate-bounce"></span>
                <span class="w-1 h-1 rounded-full bg-current [animation-delay:240ms] animate-bounce"></span>
              </span>
              <span class="ml-1 text-xs opacity-80">转写中</span>
            </div>
          {/if}
        </div>

        <button
          type="button"
          on:click={sendMessage}
          disabled={disabled || !message.trim()}
          class="mr-2 flex items-center justify-center h-8 w-8
                 bg-blue-600 hover:bg-blue-700 text-white transition
                 disabled:bg-gray-400 disabled:cursor-not-allowed
                 rounded-md shadow-sm active:scale-95 z-10"
          aria-label="发送消息"
        >
          <Send size={16} />
        </button>
      </div>

      <!-- 字数统计 -->
      {#if showCounter}
        <div class="pointer-events-none absolute right-12 bottom-2 text-[10px] text-gray-400 font-medium">
          {message.length}/256
        </div>
      {/if}
    </div>

    <!-- 外部提示只保留错误/超时 -->
    {#if voiceHint}
      <div class="mt-1 text-xs text-gray-500">{voiceHint}</div>
    {/if}
  </div>
</div>

