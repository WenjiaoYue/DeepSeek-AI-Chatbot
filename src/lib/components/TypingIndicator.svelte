<div class="typing-container animate-fade-in flex justify-start mb-6 items-end space-x-3">
  <div class="avatar-container">
    <div class="avatar avatar-bot">
      <div class="typing-pulse"></div>
    </div>
  </div>
  
  <div class="flex items-center space-x-1">
    <!-- <span class="text-sm text-gray-600 dark:text-gray-400 mr-2">正在思考</span> -->
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  </div>
</div>

<style>
  .avatar-container {
    @apply flex-shrink-0;
  }
  
  .avatar {
    @apply w-8 h-8 rounded-full flex items-center justify-center shadow-md;
  }
  
  .avatar-bot {
    @apply bg-gradient-to-br from-blue-500 to-blue-600;
  }
  
  .typing-pulse {
    @apply w-3 h-3 bg-white rounded-full animate-pulse;
  }
  
  .typing-bubble {
    @apply bg-white text-gray-900 border border-gray-200 p-4 shadow-lg relative;
    border-radius: 16px 16px 16px 4px;
  }
  
  .typing-bubble::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -8px;
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-top-color: white;
    border-right-color: white;
  }
  
  .typing-dot {
    @apply w-2 h-2 bg-gray-400 rounded-full animate-bounce;
  }
  
  .typing-dot:nth-child(2) {
    animation-delay: 0.1s;
  }
  
  .typing-dot:nth-child(3) {
    animation-delay: 0.2s;
  }
  
  .typing-dot:nth-child(4) {
    animation-delay: 0.3s;
  }
</style>