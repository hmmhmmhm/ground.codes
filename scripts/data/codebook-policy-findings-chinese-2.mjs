const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const chinesePolicyFindingsPart2 = [
  ...entries({
    reason: "twelfth-pass-place-symbol-religion-fragment-or-negative",
    words: `
        银座 红旗 凤 四象 四书 旌 帜 麾 旗帜 滓 昧 览 务 阅 骤 研 究
        习 演 自 别 然 挖 掘 持 统 交 互 应 用 产 发 创 解 滤 测 练 作
        听 跑 插 遥 洗 吸 聊 招 涂 压
      `,
  }),
  ...entries({
    reason:
      "thirteenth-pass-fragment-title-civic-medical-award-adult-or-negative",
    words:
      "芫 荽 槟 榔 芍 出租 潘 李 公 案 监 司 制 人口 醇 经 术 卫 冠 名次 称号 荣誉 荣耀 合欢 垃圾桶",
  }),
  ...entries({
    reason: "fourteenth-pass-fragment-software-legal-place-sports-or-myth",
    words: `
        服 饰 具 朋 范 标 准 讯 所 域 程 蔬 舶 崇 泳 算 资 档 议 方 能
        源 化 令 邮 通 单 旦 旨 昇 昌 易 昔 昨 评 据 件 式 类 播 对 款
        把 正 接 部 系 决 助 项 序 几 阶 极 值 率 差 积 定 列 相 间 开
        关 全 广 同 位 级 电 机 路径 循环 状态 提醒 移动 档案 车牌
        年报 地点 海域 比赛 竞赛 赛季 赛事 网球 篮球 足球 排球 赛车
        手球 棒球 赛艇 球队 球门 进球 前锋 中场 后卫 角球 助攻 替补
        平局 球衣 球鞋 球棒 壁球 集训 观赛 赛后 铅球 本垒 一垒 二垒
        三垒 投手 篮筐 控球 传球 篮板 快攻 上篮 首发 球技 射门 替换
        传中 接球 羽毛球 高尔夫 橄榄球 曲棍球 大龙 红龙
      `,
  }),
  ...entries({
    reason: "fifteenth-pass-gambling-identity-action-legal-science-or-sports",
    words: `
        黑桃 红心 英雄 粉丝 巨人 影迷 智者 听众 高手 新手 铁人 哥哥
        乐迷 观看 使用 倒入 定律 冰球 体育 球网 球拍 发球 接发 回球
        击球 球迷 果岭 球杆 球洞 球包 乒乓 田径 体操 马术 滑冰 跳水
        水球 飞盘 举重 网前 后场 前场 单打 双打 三分
      `,
  }),
  ...entries({
    reason:
      "sixteenth-pass-abstract-education-identity-safety-adventure-industrial-or-place-like",
    words: `
        命运 奇迹 秘密 宣传 周边 联盟 盟友 胜利 对手 训练 运动 评分 竞争
        轮次 考试 论文 培训 实习 本科 学位 学分 文凭 考卷 面试 成绩
        成绩单 课程表 科学 学术 研究 理论 原理 天文 地理 标准 测量 日程
        家族 亲情 人际 自我 个人 人人 群体 人才 天才 先锋 榜样 典范
        安全 保护 礼仪 礼节 冒险 探险 刺激 奋斗 拼搏 燃料 重金属 青泉
        林岸 小屿 花径 雪域 乐土 白泉 香泉 暖泉 清泉 石径 石泉 晴野
        冬泉 晴川 芳林 林泉 山泉 翠峰 青林 绿林 绿泉 远山 远岚 秋岚 春岚
      `,
  }),
  ...entries({
    reason: "seventeenth-pass-celestial-geography-education-or-school",
    words: `
        星河 银河 白洞 山脉 湖泊 河流 岛屿 冰川 冰山 冰河 海岸 海峡
        山谷 山脊 山丘 高峰 雪峰 雪谷 雪川 雪滩 雪堡 戈壁 绿洲 课堂
        课程 教材 课本 教育 作业 辅导 学期 学科 班级 测验 选修 必修
        评估 毕业 入学 学堂 校刊 校车 校服 校徽 校史 校庆 学友 学会
        科教 作文 大考
      `,
  }),
  ...entries({
    reason:
      "eighteenth-pass-education-organization-event-media-sports-or-place",
    words: `
        社 会 组 群 族 课 班 校 学 教 试 考 讲 队 文学 哲学 讲座 讲义
        讲解 学习 演讲 研讨 讲习 研讨会 练习 复习 展览 博览 博览会
        社团 组织 团队 队伍 乐队 聚会 舞会 宴会 年会 晚会 音乐会 电影
        新闻 报告 期刊 广播剧 游泳 跑步 跑道 跳绳 农场 牧场 场地 场所
        大桥 天桥 街 路
      `,
  }),
  ...entries({
    reason:
      "nineteenth-pass-education-performance-media-event-sports-celestial-or-chance",
    words: `
        小测 暑假 寒假 字母 拼音 考古 吉他 乐团 指挥 编舞 独奏 歌剧
        交响 摇滚 爵士 民谣 说唱 蓝调 嘻哈 舞曲 朋克 编曲 演奏 和声
        演唱 演技 排练 台词 独白 剧目 剧评 观演 演艺 演绎 戏班 剧作
        话剧 舞剧 小品 朗读 专辑 单曲 综艺 访谈 预告 剧照 插曲 配音
        影展 影评 观影 影片 剧集 短片 长片 喜剧 科幻 纪录片 派对 盛典
        音乐节 美食节 动漫展 艺术节 冰壶 滑雪 徒步 骑行 潜水 冲浪
        滑板 攀岩 探洞 漂流 越野 轮滑 滑翔伞 路口 行星 卫星 彗星
        光年 天体 星座 好运 幸运
      `,
  }),
  ...entries({
    reason:
      "twentieth-pass-doc-media-role-transit-celestial-luck-science-or-abstract",
    words: `
        诗 文 词 句 章 题 论 言 刊 报 典 卷 页 字 籍 册 稿 版 传
        辞 历 赋 读 写 书籍 文献 摘要 知识 信息 资料 提纲 案例
        分析 总结 观点 话题 字典 手册 插图 目录 书名 翻译 阅读 启蒙
        小说 散文 名著 传记 图纸 报纸 信函 画册 样本 草图 文章 读物
        百科 辞典 年鉴 书信 计划书 明信片 笔记本 章节 文字 书展 舞
        歌 唱 戏 剧 团 琴 笛 锣 铙 笙 箫 弦 曲目 艺术 音乐
        舞蹈 绘画 摄影 雕塑 戏剧 诗歌 动画 时尚 乐器 合唱 作曲 戏曲
        杂技 表演 作品 展品 文物 古玩 古籍 邮票 漫画 照片 唱片 乐谱
        音响 动漫 海报 剧情 音效 舞台 灯光 道具 服装 面具 场景 剧本
        情节 演出 旋律 节拍 舞狮 花车 画作 创作 剧团 古装 文艺 真人
        对话 情景 纪录 片头 片尾 演示 古典 潮流 相册 镜头 色彩 构图
        拍摄 光线 背景 视角 活动 项目 展示 交流 体验 盛会 节日 旅行
        旅程 游记 游览 休闲 假期 露营 野餐 观光 指南 日记 回忆 娱乐
        分组 放映 系列 评论 讨论 分享 推荐 制作 发行 社交 互动 示范
        探讨 线索 答案 探索 合作 发现 服务 职业 生涯 参与 经验 提升
        联系 关系 庆典 理念 价值 信念 愿景 使命 方向 步骤 行动 成果
        贡献 引导 促进 进步 发展 趋势 方案 解决 未来 效果 优势 行业
        动态 模式 日期 位置 中心 区域 标志 礼品 食品 宠物 口碑 信誉
        信任 品质 环保 回馈 满意 团体 透明 诚信 机会 朋友 伙伴 友人
        知己 邻居 信使 人物 人像 肖像 家庭 童年 青春 车 船 舟 筏
        帆 航 舵 艇 驾 轮 轿 轨 舫 舸 航线 航标 飞机 火车
        摩托 公交 轿车 卡车 货车 轮船 单车 电车 巴士 地铁 帆船 游艇
        运输 飞船 热气球 滑翔机 车窗 车顶 车门 车轮 小车 小船 步行
        宇 宙 宇宙 星星 飞行 天空 星辰 流星 星光 星球 星空 星系
        星云 星海 太阳 月亮 月光 夜空 星辉 星灯 天际 天边 云海 福
        缘 祥 吉 瑞 运 贺 祝 祝愿 吉祥 团圆 团聚 生日 庆祝 祝贺
        生物 两栖 昆虫 鱼类 矿物 气体 地热 热泉 图表 颜色 数字 图形
        构造 结构 化石 恐龙 石英 石膏 滑石 长石 辉石 石墨 硅石 萤石
        生长 平衡 协调 意识 事件 分布 比例 相关 条件 连续 面积 变化
        平面 性质 范围 相似 对称 集合 数值 概念 形式 分配 排列 解答
        结论 生命 大气 湿度 效率 原料 成品 现象 培养 重复 实践 实例
        传播 物质 质量 发明 核心 水平 进程 表现 态度 类型 热度 难度
        智力 局面 局部 全局 局限 沉浸 虚构 设定 寓意 印象 亮点 清洁
        开关 温度 浓度 容量 重量 工序 用途 过程 结果 观察 视野 角度
        细节 记录 生态 环境 气候
      `,
  }),
  ...entries({
    reason:
      "twenty-first-pass-doc-media-place-luck-transit-science-or-abstract",
    words: `
        谜 锁 房 图 道 友 书 梦 影 语 画 海 泉 桥 家 愿 话 知
        库 像 台 技 展 室 区 阳 月 星 游 玩 宴 旅 途 天 空 峰
        洞 川 隧 洲 洋 岳 本 信 问 表 录 厅 户 计 庭 吧 赞
        誉 名 篇 仪 答 链 数 速 热 煤 炭 球 寿 雷 铅 铝 锌
        镍 锡 号 印 记 邻 约 雹 毛 皮 史 说 铺 策 镁 陆
        拍 垒 幕 秒 伴 顺 历史 文化 语言 主题 内容 反馈 建议
        计划 目标 策略 技巧 要点 资源 故事 传说 传奇 寓言 童话
        角色 幽默 情感 声音 动作 形象 风格 传统 节奏 表情 创意
        幻想 梦境 设计 印刷 收藏 模型 符号 印记 拼图 温泉 航海
        滑翔 游乐 反应 速度 配乐 影像 片段 经典 梦想 感受 元素
        画面 情绪 图案 笔记 封面 习惯 兴趣 愿望 陪伴 画展 高度
        日出 日落 树屋 步道 图书 小路 幸福 友谊 桥梁 诗篇 乐章
        舞步 隧道 拱桥 悬桥 手稿 指导 书屋 钢琴 心灵 能量 心境
        边界 梦幻 空间 房屋 列车 行程 航图 油画 水彩 素描 信件
        名片 层次 框架 音色 音调 友情 祥和 美梦 信封 信纸 博物
        院子 阳台 庭院 温室 海滩 房子 房间 楼房 单元 日历 小组
        心情 奇幻 杂志 喜好 出行 徽章 钱包 推理 判断 谜团 地壳
        岩层 陀螺 弹珠 轨道 画画 玩耍 玩伴 卡通 滑梯 秋千 装置
        黑板 特征 海底 海沟 海流 动力 观摩 志愿 出版 美术 图画
        爱好 呐喊 观赏 舞美 戏台 音域 音阶 和弦 乐感 静物 抽象
        写实 透视 明暗 质感 笔触 意境 鉴赏 临摹 写生 速写 工笔
        写意 丹青 彩绘 粉彩 水墨 白描 重彩 淡彩 泼墨 泼彩 点彩
        线描 勾勒 渲染 晕染 草稿 色调 协作 进度 叙述 阴影 高光
        边框 歌声 曲调 音质 乐坛 音律 歌谣 曲风 前程 乐音 古代
        幻境 意见 名画 友爱 艺术品 音乐剧 儿童剧 古生物 金刚石
        方解石 白云石 铝土矿 钾长石 钠长石 石灰石 黄铁矿
      `,
  }),
  ...entries({
    reason: "twenty-second-pass-doc-media-event-place-or-material-collision",
    words: `
        书包 书房 白书 画卷 壁画 节目 乐曲 音符 音轨 歌唱 歌舞 乐声
        欢歌 盛宴 宴席 聚餐 欢庆 喜庆 沙龙 旅途 行李 森林 沙滩 峡谷
        瀑布 海洋 沙漠 草原 山巅 湖面 海边 峰顶 林间 林地 田园 大海
        雪原 湿地 沙洲 晴空 蓝天 象牙
      `,
  }),
  ...entries({
    reason: "twenty-third-pass-chemical-myth-illusion-or-place-collision",
    words: "溴 鸾 幻 幻影 四海 四平 普洱",
  }),
  ...entries({
    reason: "twenty-fourth-pass-fragment-negative-media-or-body-collision",
    words: "日 干 穴 乐动 音悦",
  }),
  ...entries({
    reason: "twenty-fifth-pass-negative-fragment-or-myth-collision",
    words: "溲 湎 湮 泯 潲 俗 假 坑 渍 渎 滚 鲲",
  }),
  ...entries({
    reason: "twenty-sixth-pass-place-collision",
    words: "黄石",
  }),
  ...entries({
    reason: "twenty-seventh-pass-place-food-animal-or-fragment-collision",
    words: "草 白沙 朝阳 菊花 绿茶 韭菜 黄牛 黑木耳",
  }),
  ...entries({
    reason: "thirty-second-pass-negative-fragment",
    words: "苦",
  }),
  ...entries({
    reason: "thirty-third-pass-negative-compound",
    words: "苦果 酸葡萄",
  }),
  ...entries({
    reason: "thirty-fifth-pass-negative-fragment",
    words: "阴",
  }),
  ...entries({
    reason: "thirty-sixth-pass-commerce-place-civic-or-negative-collision",
    words: "奢华 木兰 黑冰 变革 和平 团结 名品 佳品",
  }),
  ...entries({
    reason: "forty-first-pass-pest-or-stinging-insect",
    words: "蚊 蝇 蝎 蚊子",
  }),
  ...entries({
    reason: "forty-fourth-pass-disaster-or-pest-collision",
    words: "旱 蝗 蝗虫",
  }),
  ...entries({
    reason: "forty-sixth-pass-animal-collision",
    words: "蝙蝠 黑蝙蝠",
  }),
  ...entries({
    reason: "forty-ninth-pass-brand-or-common-fruit-collision",
    words: "苹果",
  }),
  ...entries({
    reason: "fiftieth-pass-animal-collision",
    words: "鸡 鸭",
  }),
];
