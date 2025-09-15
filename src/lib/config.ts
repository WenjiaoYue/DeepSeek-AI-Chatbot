export const CONFIG = {
  baseURL: 'http://220.203.247.201:8043/v1',
  model: '/models/DeepSeek-V3.1-G2',
  apiKey: '123456'
};

export const TOPIC_FIRST_MESSAGES: Record<string, string> = {
  // 实用主题
  '学习编程': '我想学习编程，请问从哪里开始比较好？',
  '旅游规划': '我计划去三亚旅游三天，有什么推荐的行程安排吗？',
  '健康饮食': '请推荐一些健康的饮食习惯和食谱。',
  '职业发展': '我想提升自己的职业技能，有什么建议吗？',
  '科技新闻': '最近有哪些值得关注的科技新闻？',
  
  // 娱乐主题
  '讲个笑话': '请讲一个有趣的笑话让我开心一下。',
  '脑筋急转弯': '来个脑筋急转弯挑战我吧！',
  '成语接龙': '我们来玩成语接龙吧，我先说"一帆风顺"。'
};

export const TOPIC_CATEGORIES = {
  practical: {
    title: '实用主题',
    topics: ['旅游规划', '健康饮食', '职业发展', '学习编程', '科技新闻']
  },
  entertainment: {
    title: '娱乐主题',
    topics: ['讲个笑话', '脑筋急转弯', '成语接龙']
  }
};