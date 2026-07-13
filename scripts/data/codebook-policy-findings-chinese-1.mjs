const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const chinesePolicyFindingsPart1 = [
  ...entries({
    reason: "tobacco",
    words: "烟",
  }),
  ...entries({
    reason: "adult-or-sexual-double-meaning",
    words: "高潮",
  }),
  ...entries({
    reason: "place-landmark-or-geopolitical-name",
    words: "普陀 南海 西沙 东沙 黄岩 金门 马祖 澎湖 大连 天坛",
  }),
  ...entries({
    reason: "named-river-lake-or-place-like-label",
    words: `
        珠江 辽河 淮河 海河 洞庭 鄱阳 滇池 巢湖 洱海 阳澄 西江 东江
        南江 北江 沱江 怒江 红河 松江 清江 乌江 涪江 岷江 白河 汉江
        漓江 湘江 赣江 闽江 黑河 渭河 桂江
      `,
  }),
  ...entries({
    reason: "religion-occult-myth-or-holiday",
    words: "魔术 巫师 妖精 幽灵 亡灵 天使 灵魂 中元 天宫 嫦娥 仙女 平安夜",
  }),
  ...entries({
    reason: "medical-anatomy-or-clinical",
    words: `
        愈合 护士 皮肤 细胞 器官 肌肉 骨骼 免疫 生殖 激素 细菌 淋巴
        脊髓 大脑 小脑 脑干 肝脏 肾脏 心脏 胰腺 脾脏 胆囊 毛发 关节
        韧带 肌腱 生理
      `,
  }),
  ...entries({
    reason: "medicine-herb-or-drug-root",
    words:
      "虫草 川芎 白芷 黄连 黄柏 香附 牛膝 杜仲 石斛 麦冬 黄精 地黄 枳实 木通 罂粟 决明子",
  }),
  ...entries({
    reason: "legal-political-or-civic",
    words: `
        审查 备案 批准 赔偿 救济 调解 和解 权利 律师 证人 原告 被告
        案件 权力 人权 公民 改革 民族 制度 民主 条款
      `,
  }),
  ...entries({
    reason: "weapon-combat-threat-or-disaster",
    words: "拳击 武术 射击 塔防 猎人 忍者 敌人 武侠 灾难 反击 警报 刺客",
  }),
  ...entries({
    reason: "card-board-game-or-gambling-adjacent",
    words: "卡牌 纸牌 暗棋 双陆棋",
  }),
  ...entries({
    reason: "brand-product-platform-or-event",
    words: "北斗 奥运 蓝牙 智联 猎云 乐视 咪咕 迅雷 酷狗 虾米 酷我",
  }),
  ...entries({
    reason: "planet-or-celestial-proper-name",
    words: "天王星 海王星 冥王星",
  }),
  ...entries({
    confidence: "medium",
    reason: "place-like-directional-label",
    words: "南澳 北澳 东澳 西澳 南湾 北湾 东湾 西湾",
  }),
  ...entries({
    confidence: "medium",
    reason: "generated-or-poetic-compound",
    words: "青雨 青雪 青露 青霞 青香 白香 绿雪 绿露 绿霞",
  }),
  ...entries({
    confidence: "medium",
    reason: "awkward-childish-or-generated-looking",
    words: "水瓢子 小星星 小太阳 小月亮",
  }),
  ...entries({
    reason: "second-pass-brand-platform-or-social-app",
    words: "优酷 虎扑 陌陌 美克",
  }),
  ...entries({
    reason: "second-pass-planet-or-celestial-proper-name",
    words: "地球 水星 金星 火星 木星 土星",
  }),
  ...entries({
    reason: "second-pass-place-sea-mountain-or-landmark",
    words: "北海 东海 西海 香山 南山 五岳",
  }),
  ...entries({
    reason: "second-pass-lake-or-place-like-label",
    words:
      "东湖 南湖 北湖 龙湖 南岭 南村 南园 南河 南岛 西塔 西港 西岭 西河 西村",
  }),
  ...entries({
    reason: "second-pass-anatomy-or-body-root",
    words: "肺 肝 胃 肾 牙 眼 耳 鼻 喉 脉 胆 骨 脑 肠 齿",
  }),
  ...entries({
    reason: "second-pass-medical-physiology-or-biomedical",
    words: "灸 呼吸 消化 发育 心跳 基因 核酸 遗传",
  }),
  ...entries({
    reason: "second-pass-medicine-herb-or-drug-root",
    words: "枸杞 艾草 陈皮 金银花 银杏叶",
  }),
  ...entries({
    reason: "second-pass-legal-case-evidence-or-civic",
    words: "卷宗 证言 证据 当事人 合规 义务 权益 权限",
  }),
  ...entries({
    reason: "second-pass-religious-ritual-occult-or-myth",
    words: "祈 庵 坛 魂 符文 精灵 信仰 图腾 仪式",
  }),
  ...entries({
    reason: "second-pass-gambling-or-alcohol",
    words: "筹 干杯",
  }),
  ...entries({
    confidence: "medium-high",
    reason: "second-pass-generated-looking-color-nature-compound",
    words: "青沙 绿沙",
  }),
  ...entries({
    reason: "third-pass-place-civic-region-or-opera-label",
    words: `
        市 县 省 府 国 渝 湘 浙 滇 澳 淮 漓 洱 渭 沂 沅 沱 泸 泾 灞
        澧 濮 京剧 豫剧 粤剧 川剧 越剧 黄梅戏 西洋 西域
      `,
  }),
  ...entries({
    reason: "third-pass-royalty-title-or-proper-name-adjacent",
    words: "王 后 皇 侯 伯 卿 帝 君 王子 公主 天王 领主",
  }),
  ...entries({
    reason: "third-pass-software-network-account-or-hardware-jargon",
    words: `
        网络 平台 应用 数据 电子 设备 手机 电脑 平板 耳机 音箱 电信
        通信 宽带 系统 终端 号码 流量 监控 界面 图标 按钮 屏幕 网页
        账号 密码 软件 硬件 程序 备份 共享 设置 版本 下载 上传 带宽
        节点 域名 搜索 引擎 日志 组件 模块 直播 频道 播放 订阅 账户
        画质 字幕 控制器 机器人 显示器 链接 同步 智能 识别 指纹 像素
        导入 导出 保存 模板 兼容 安装 接口
      `,
  }),
  ...entries({
    reason: "third-pass-game-product-or-virtual-jargon",
    words: `
        游戏 任务 装备 技能 地图 副本 公会 玩家 主机 手柄 卡带 游戏展
        游戏机 地下城 虚拟 属性 敏捷 等级
      `,
  }),
  ...entries({
    reason: "third-pass-medical-body-health-or-senses",
    words: `
        胎 嘴 肩 腿 脚 脸 嗓 手指 身体 体重 体型 健康 心理 咨询
        健身 健身房 营养 代谢 繁殖 蛋白 脂肪 触觉 嗅觉 味觉 视觉
        听觉 试管 试剂
      `,
  }),
  ...entries({
    reason: "third-pass-legal-political-finance-civic-or-identity",
    words: `
        权 审 判 罚 证 护照 签证 协议 投资 收益 风险 监督 执行 登记
        申请 公正 正义 自由 平等 权威 银行 发票 身份 隐私 认证
      `,
  }),
  ...entries({
    reason: "third-pass-violence-adult-religion-or-fantasy-risk",
    words: `
        刃 弹 靶 护甲 头盔 对抗 进攻 防守 拦截 骑士 勇士 部落 兽人
        怪物 怪兽 灵 灵性 冥想 恋 婚礼 亲密
      `,
  }),
  ...entries({
    reason: "fourth-pass-malformed-or-foreign-script",
    words: "霧 雲 滝 水獺 苦蕎",
  }),
  ...entries({
    confidence: "medium-high",
    reason: "fourth-pass-generated-looking-material-compound",
    words: `
        木囊 木毯 木被 木巾 木帕 木袱 木烛 木饼 木糕 木丸 木酥 木脆
        木羹 竹被 竹袱 竹炉 竹烛 竹饼 竹糕 竹丸 竹酥 竹脆 竹羹
        纸被 纸枕 纸烛 纸炉 纸杵 纸臼 纸砧
      `,
  }),
  ...entries({
    reason: "fourth-pass-place-region-landmark-or-institution",
    words: `
        东极 大屿 红岛 长山 白山 黑山 青山 红山 金山 银山 铜山 南路
        南桥 南苑 南门 西街 西门 古城 景点 遗址 名胜 古迹 遗产 王国
        度假村 幼儿园 养老院 雕塑公园
      `,
  }),
  ...entries({
    reason: "fourth-pass-brand-platform-software-account-or-media",
    words: `
        品牌 用户 客户 会员 编程 开发 测试 浏览 存储 访问 功能 选项
        窗口 面板 菜单 预览 格式 剪切 缩放 裁剪 点赞 视频 音频 播客
      `,
  }),
  ...entries({
    reason: "fourth-pass-medical-body-herb-or-health",
    words:
      "菌 菌类 护肤 指甲 疲劳 木香 紫草 紫菀 薄荷 桑叶 槐花 槐米 荷叶 蒲公英",
  }),
  ...entries({
    reason: "fourth-pass-legal-political-civic-or-finance",
    words: `
        倡导 证书 证件 领袖 游行 经济 财经 货币 现金 支付 交易 账单
        收银 信用卡 预算 成本 回报 利润 订单 付款 古币 金币 硬币 协会
      `,
  }),
  ...entries({
    reason: "fourth-pass-military-violence-game-or-religion",
    words: `
        符 盔 勇者 柔道 摔跤 防线 象棋 围棋 跳棋 飞行棋 黑白棋
        国际象棋 棋类 棋谱 棋艺 棋手 对弈 对局
      `,
  }),
  ...entries({
    reason: "fifth-pass-person-title-role-or-identity",
    words: `
        老师 教师 教授 校长 院长 导师 助教 专家 学者 学生 同学 校友
        作者 读者 导演 演员 主持 嘉宾 演讲者 经理 裁判 评委 设计师
        摄影师 艺术家 音乐家 雕塑家 消费者 服务员 志愿者 创作者
      `,
  }),
  ...entries({
    reason: "fifth-pass-game-technical-math-or-chemistry-jargon",
    words: `
        棋 棋盘 棋子 参数 变量 函数 导数 矩阵 向量 方程 公式 坐标
        系数 微分 斜率 方差 均值 定理 证明 氧 氧气 氢 氦 氮 钠 钾
        钙 酶
      `,
  }),
  ...entries({
    reason: "fifth-pass-fitness-medical-commercial-or-real-estate",
    words: `
        瑜伽 健美 恢复 监测 产品 商品 价格 销售 买卖 供应 需求 库存
        批发 零售 商家 商贩 商场 商圈 促销 优惠 折扣 消费 兑换 特权
        广告 营销 运营 房产 物业 房东 利益
      `,
  }),
  ...entries({
    reason: "fifth-pass-dating-holiday-or-ritual",
    words: "光棍 寒食 腊八 七夕",
  }),
  ...entries({
    reason: "sixth-pass-negative-shame-failure-distress-or-hazard",
    words: "怒 哀 悲 问题 劣势 失误 悲剧 溺 溃 烟雾 爆竹",
  }),
  ...entries({
    reason: "sixth-pass-industrial-hardware-lab-or-process-jargon",
    words: `
        阀 泵 焊 铸 锻 铣 矿 机床 夹具 磨具 焊接 切割 加工 制造
        生产 车间 仪器 烧杯 天平 电路 电压 功率 电缆 导线 电流 电机
        马达 转子 轴承 扭矩 负载 装配 零件 部件 机械 齿轮 传动 驱动
        线圈 磁场 溶液 试验
      `,
  }),
  ...entries({
    reason: "sixth-pass-math-physics-chemistry-or-software-jargon",
    words: `
        数学 统计 曲线 数列 序列 常数 几何 映射 顶点 半径 直径 运算
        维度 分子 化学 物理 粒子 原子 量子 力学 光学 声学 热量 体积
        密度 波动 折射 频率 硫磺 钴 钛 铬 锰 钨 钼 铋 锗 镓 铌 钽
        锂 铯 铷 铊 镉 锑 注册 连接 传输 维护 支持 升级 优化 更新
        通知 定位 标识 列表 分类 回放
      `,
  }),
  ...entries({
    reason: "sixth-pass-game-competition-award-or-scoring",
    words: `
        金牌 银牌 铜牌 勋章 排行榜 赢家 胜算 胜者 积分 得分 比分 罚球
        点球 联赛 决赛 预赛 复赛 赛程 火炬 竞速 模拟 解谜 生存 养成
        竞技 沙盒
      `,
  }),
  ...entries({
    reason: "sixth-pass-commercial-finance-person-role-or-event",
    words: `
        信用 赞助 物流 商城 购物 票房 票务 机票 预约 评价 作家 诗人
        编剧 歌手 舞者 导游 游客 厨师 画家 观众 球员 教练 选手 买家
        卖家 园丁 才子 才女 名人 明星 文人 艺人 助手 老人 宝宝 青少年
        西子 昆曲 北辰 青年节 儿童节
      `,
  }),
  ...entries({
    reason: "sixth-pass-instrument-specialist-or-fitness-health",
    words: `
        贝斯 小提琴 大提琴 单簧管 电子琴 合成器 扬琴 古筝 琵琶 二胡
        古琴 小号 长号 长笛 体能 锻炼 热身 哑铃 杠铃
      `,
  }),
  ...entries({
    reason: "seventh-pass-finance-commercial",
    words: "币 财 货 价 利 买 卖 供 需 元 店 商 红包 套餐 顾客 摊贩 商会",
  }),
  ...entries({
    reason: "seventh-pass-medical-body-health-or-adult",
    words: "身 体 背 肥 康 健 养 碳水 化妆品 拉伸 耐力 媚 艳",
  }),
  ...entries({
    reason: "seventh-pass-violence-disaster-hazard-or-political",
    words: "震 火山 熔岩 岩浆 喷发 火口 火山口 灰烬 将 侦探 悬疑 调查 口号",
  }),
  ...entries({
    reason: "seventh-pass-religion-ritual-holiday-or-place-institution",
    words: `
        戒 幽 春节 元宵 中秋 端午 重阳 清明 除夕 新年 元旦 冬至 夏至
        秋分 春分 小年 大年 龙舟 舞龙 城堡 城市 村庄 村落 小镇 港口
        空港 灯塔 园区 校园 学校 大学 学院 小学 中学 学府 公园 乐园
        花园 果园 茶园 梅园 竹园 山庄 办公室 加油站 服务站 便利店
        停车场 图书馆 博物馆 艺术馆 文化馆 电影院 音乐厅 体育馆
        展览馆 咖啡馆 游乐场 滑雪场 竞技场 俱乐部 会所 商铺 店铺
        餐厅 茶馆 宾馆 旅馆 旅社 旅店 客栈 宿舍 别墅 公馆 宅邸
        住宅 公寓
      `,
  }),
  ...entries({
    reason: "seventh-pass-software-technical-corporate-or-competition",
    words: `
        交互 构建 计算 原型 逻辑 光盘 线路 管理 流程 规范 覆盖 实施
        资讯 公告 会议 机构 媒体 社区 领导 推广 创业 胜 输 局 赛 竞 榜
      `,
  }),
  ...entries({
    reason: "eighth-pass-fragments",
    words: `
        钥 鹦 鹉 鸳 鸯 蝴 蚂 蜻 蝙 蜈 蟋 蟑 螳 馄 饨 玻 珊 瑚 苜 蓿 橄
        榄 檬
      `,
  }),
  ...entries({
    reason: "eighth-pass-place-like-or-venue-institution",
    words: `
        小溪 柳溪 竹溪 星湾 雪岭 雪湖 雪溪 月湖 星湖 晨溪 白溪 绿溪 小湖
        花溪 梅岭 翠湖 翠岭 云溪 清溪 河湾 湖畔 山路 教室 影院 剧院 画室
        书院 场馆 展厅 展馆 戏院 书店 操场 食堂 饭店 食府 讲座厅 会议室
        实验室 资料室 服务台 咖啡厅
      `,
  }),
  ...entries({
    reason: "eighth-pass-software-media-or-technical",
    words: `
        科技 技术 录音 剪辑 特效 视听 文档 索引 图库 快照 自拍 聊天 充电
        夜视 电视 相机 扬声器 收音机 控制 广播 话筒 播音 电波 电声 电池
        插头 插座 合成 模糊 亮度 对比 饱和 音量 时长 电话 邮件 地址 消息
        图像 录像 字体 布局
      `,
  }),
  ...entries({
    reason: "eighth-pass-commercial-finance-or-role",
    words: `
        市场 集市 商店 展位 摊位 展会 展台 展区 市集 学费 讲师 教员 助理
        乐手 代表
      `,
  }),
  ...entries({
    reason: "ninth-pass-software-technical",
    words:
      "验证 导航 教程 机器 电器 器械 电源 型号 滤器 操作 调节 指示 过滤 研磨 搅拌",
  }),
  ...entries({
    reason: "ninth-pass-commercial-product-service",
    words: "货物 货架 标签 包装 样品 快递 邮局 包裹 航班 住宿 香水 纪念品",
  }),
  ...entries({
    reason: "ninth-pass-medical-personal-care-or-religious",
    words: "美容 化妆 香氛 光环 幡 幢",
  }),
  ...entries({
    reason: "ninth-pass-place-venue-infrastructure",
    words: `
        机场 车站 码头 超市 工厂 仓库 仓储 街区 街道 公路 大道 车库
        车行 水库 营地 栈房 球场 发球区 广场 胡同 巷子 街角 剧场 画廊
      `,
  }),
  ...entries({
    reason: "ninth-pass-proper-place-geographic-root-or-calendar",
    words: "泗 涪 洛 滁 滕 渤 漳 潍 潞 濉 濠 瀛 嵩 岱 花朝 节气",
  }),
  ...entries({
    reason: "tenth-pass-identity-family-role",
    words: `
        子 父 母 兄 弟 姐 妹 女 士 祖 师 客 主 员 者 儿童 孩子 小孩
        母亲 父亲 父母 兄弟 姐妹 姐姐 弟弟 妹妹 女子 男子 家人 家长
        乘客 旅客 研究生
      `,
  }),
  ...entries({
    reason: "tenth-pass-place-venue-fragment-or-geographic-label",
    words: `
        岛 乡 镇 堡 宫 楼 亭 阁 站 馆 堂 院 舍 苑 居 栈 庐 宅 庄 坊
        大河 小河 大山 小山 海湾 西岸 西北 西南 大街 大楼 家庭日
      `,
  }),
  ...entries({
    reason: "tenth-pass-software-technical-fragment-or-science-math",
    words: `
        视 频 络 网 码 端 控 屏 调频 电台 实验 工程 假设 预测 偏差 极值
        随机 推断 命题 约束 波形 对照 误差 电力
      `,
  }),
  ...entries({
    reason: "tenth-pass-legal-civic-commercial-medical-religion-or-game",
    words: `
        校规 伦理 辩论 局势 决策 责任 劳动 社会 建设 压力 睡眠 反射
        祝福 典礼 宝冠 火焰 火球 黑火 黑洞 泪水 分数 排名 回合 局数
        运气
      `,
  }),
  ...entries({
    reason:
      "eleventh-pass-gambling-finance-medical-adult-legal-software-hazard-place-or-negative",
    words: `
        卡 牌 票 博 睡 眠 渴 爱 亲 情 娇 红颜 激情 规 则 规则 公平 秩序
        道德 设 备 信号 设施 论坛 火 焰 烈 烟花 焰火 火花 华 泰 西餐
        西式 西部 五湖 乡村 雪山 河畔 西林 遗迹 泪 怜 渣 滥 滞 漏 争
        负 寂 旧 昏 暗 浊 遗物
      `,
  }),
];
