export const CONFIG = {
  baseURL: 'http://220.203.247.201:8043/v1',
  model: '/models/DeepSeek-V3.1-G2',
  apiKey: '123456'
};

export const TOPIC_FIRST_MESSAGES: Record<string, string> = {
  // 实用主题
  '旅游规划': '我计划去三亚旅游三天，有什么推荐的行程安排吗？',
  '特色美食': '请推荐一些健康的饮食习惯和食谱。',
  '免税攻略': '去三亚旅游，有哪些免税购物攻略值得参考？',
  '景点介绍': '请介绍一下三亚有哪些必去的景点。',
  
  // 娱乐主题
  '讲个笑话': '请讲一个有趣的笑话让我开心一下。',
  '脑筋急转弯': '来个脑筋急转弯挑战我吧！',
  '成语接龙': '我们来玩成语接龙吧，我先说"一帆风顺"。'
};

export const TOPIC_CATEGORIES = {
  practical: {
    title: '海南三亚',
    topics: ['旅游规划', '特色美食', '免税攻略', '自贸前沿', '景点介绍']
  }
};