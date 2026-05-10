# Chinese Codebook Review - 2026-05-10

Review note for Chinese codebook cleanup. This pass updates the distributed Chinese codebook and source generated/refined files where high-confidence problematic words were found.

Selection criteria:

- Latin or digit mixed entries in a Chinese word set.
- Brand, platform, place, and landmark names.
- Adult, risky, violent, or negative terms.
- Sports/tournament jargon and overly technical or institutional terms that do not work well as neutral address words.

Replacement rules:

- Distributed codebook replacements must not already exist in the Chinese codebook or source word pool.
- Replacement words should be neutral, natural, and suitable as address words.
- The distributed codebook size and uniqueness must remain unchanged.
- Source-only problematic words are removed rather than replaced to avoid expanding regenerated codebooks with artificial additions.

## Distributed Replacements

| Original | Replacement | Reason |
| --- | --- | --- |
| QQ | 晨溪 | Latin or digit mixed word |
| B站 | 松径 | Latin or digit mixed word |
| 巴宝莉 | 竹影 | brand or platform name |
| 博柏利 | 云岚 | brand or platform name |
| 卡地亚 | 月湾 | brand or platform name |
| 普拉达 | 花坞 | brand or platform name |
| 香奈儿 | 柳岸 | brand or platform name |
| 阿玛尼 | 清泉 | brand or platform name |
| 巴尔曼 | 石径 | brand or platform name |
| 阿迪达斯 | 翠谷 | brand or platform name |
| 雅诗兰黛 | 晴岚 | brand or platform name |
| 施华洛世奇 | 雨巷 | brand or platform name |
| 哔哩哔哩 | 兰亭 | brand or platform name |
| 黄鹤楼 | 梅岭 | place or landmark name |
| 鄱阳湖 | 青禾 | place or landmark name |
| 洞庭湖 | 芳洲 | place or landmark name |
| 阳澄湖 | 碧溪 | place or landmark name |
| 南盘江 | 远山 | place or landmark name |
| 北盘江 | 暖阳 | place or landmark name |
| 张家界 | 微澜 | place or landmark name |
| 青海湖 | 香径 | place or landmark name |
| 峨眉山 | 林荫 | place or landmark name |
| 珠穆朗玛 | 春岚 | place or landmark name |
| 长城 | 秋水 | place or landmark name |
| 故宫 | 夏木 | place or landmark name |
| 天安门 | 冬晴 | place or landmark name |
| 西湖 | 竹溪 | place or landmark name |
| 泰山 | 松风 | place or landmark name |
| 黄山 | 云影 | place or landmark name |
| 华山 | 星湾 | place or landmark name |
| 青岛 | 花径 | place or landmark name |
| 台湾 | 柳溪 | place or landmark name |
| 世界杯 | 清露 | sports or tournament jargon |
| 跆拳道 | 翠岭 | sports or tournament jargon |
| 守门员 | 晴川 | sports or tournament jargon |
| 乒乓球 | 雨声 | sports or tournament jargon |
| 沙滩球 | 兰溪 | sports or tournament jargon |
| 运动员 | 梅影 | sports or tournament jargon |
| 比赛服 | 青篱 | sports or tournament jargon |
| 运动鞋 | 芳林 | sports or tournament jargon |
| 运动服 | 碧潭 | sports or tournament jargon |
| 训练营 | 远帆 | sports or tournament jargon |
| 比赛日 | 暖风 | sports or tournament jargon |
| 友谊赛 | 微光 | sports or tournament jargon |
| 锦标赛 | 香林 | sports or tournament jargon |
| 公开赛 | 林泉 | sports or tournament jargon |
| 邀请赛 | 春水 | sports or tournament jargon |
| 团体赛 | 秋岚 | sports or tournament jargon |
| 单项赛 | 夏云 | sports or tournament jargon |
| 淘汰赛 | 冬月 | sports or tournament jargon |
| 小组赛 | 松涛 | sports or tournament jargon |
| 任意球 | 云溪 | sports or tournament jargon |
| 奥林匹克 | 星灯 | sports or tournament jargon |
| 保龄球 | 花溪 | sports or tournament jargon |
| 马拉松 | 柳风 | sports or tournament jargon |
| 交易所 | 清荷 | technical or institutional term |
| 维生素 | 石泉 | technical or institutional term |
| 贝叶斯 | 翠湖 | technical or institutional term |
| 独立性 | 晴野 | technical or institutional term |
| 班主任 | 雨荷 | technical or institutional term |
| 研究员 | 兰舟 | technical or institutional term |
| 讲解员 | 梅园 | technical or institutional term |
| 培训师 | 芳草 | technical or institutional term |
| 教育者 | 碧云 | technical or institutional term |
| 传感器 | 远树 | technical or institutional term |
| 充电器 | 暖霞 | technical or institutional term |
| 调节器 | 微雨 | technical or institutional term |
| 变压器 | 林溪 | technical or institutional term |
| 继电器 | 春芽 | technical or institutional term |
| 半成品 | 秋声 | technical or institutional term |
| 显微镜 | 夏荷 | technical or institutional term |
| 化合物 | 冬泉 | technical or institutional term |
| 蛋白质 | 竹园 | technical or institutional term |
| 反应器 | 松影 | technical or institutional term |
| 参与者 | 云舟 | technical or institutional term |
| 研究者 | 月泉 | technical or institutional term |
| 主持人 | 星野 | technical or institutional term |
| 会议中心 | 花桥 | technical or institutional term |
| 项目管理 | 柳庭 | technical or institutional term |
| 解决方案 | 翠竹 | technical or institutional term |
| 分辨率 | 兰香 | technical or institutional term |
| 矿物质 | 梅溪 | technical or institutional term |
| 酒精 | 青云 | adult, risky, violent, or negative term |
| 成人 | 芳径 | adult, risky, violent, or negative term |
| 武器 | 碧林 | adult, risky, violent, or negative term |
| 炸弹 | 远岚 | adult, risky, violent, or negative term |
| 疾病 | 暖泉 | adult, risky, violent, or negative term |
| 病毒 | 香泉 | adult, risky, violent, or negative term |
| 恐怖 | 林岸 | adult, risky, violent, or negative term |
| 犯罪 | 春风 | adult, risky, violent, or negative term |

## Source-Only Removals

| Original | Action | Reason |
| --- | --- | --- |
| 3D | removed from source | source-only high-confidence cleanup word |
| 4G | removed from source | source-only high-confidence cleanup word |
| 5G | removed from source | source-only high-confidence cleanup word |
| 618 | removed from source | source-only high-confidence cleanup word |
| 澳门 | removed from source | source-only high-confidence cleanup word |
| 北京 | removed from source | source-only high-confidence cleanup word |
| 车载GPS | removed from source | source-only high-confidence cleanup word |
| 车载WiFi | removed from source | source-only high-confidence cleanup word |
| 成都 | removed from source | source-only high-confidence cleanup word |
| 仇恨 | removed from source | source-only high-confidence cleanup word |
| 感染 | removed from source | source-only high-confidence cleanup word |
| 广州 | removed from source | source-only high-confidence cleanup word |
| 杭州 | removed from source | source-only high-confidence cleanup word |
| 酒吧DJ | removed from source | source-only high-confidence cleanup word |
| 南京 | removed from source | source-only high-confidence cleanup word |
| 厦门 | removed from source | source-only high-confidence cleanup word |
| 上海 | removed from source | source-only high-confidence cleanup word |
| 事故 | removed from source | source-only high-confidence cleanup word |
| 术后CT | removed from source | source-only high-confidence cleanup word |
| 术后MRI | removed from source | source-only high-confidence cleanup word |
| 术后X光 | removed from source | source-only high-confidence cleanup word |
| 苏州 | removed from source | source-only high-confidence cleanup word |
| 武汉 | removed from source | source-only high-confidence cleanup word |
| 西安 | removed from source | source-only high-confidence cleanup word |
| 香港 | removed from source | source-only high-confidence cleanup word |
| A字裙 | removed from source | source-only high-confidence cleanup word |
| ABC | removed from source | source-only high-confidence cleanup word |
| ACD | removed from source | source-only high-confidence cleanup word |
| AEDT | removed from source | source-only high-confidence cleanup word |
| AI | removed from source | source-only high-confidence cleanup word |
| API | removed from source | source-only high-confidence cleanup word |
| ASCII | removed from source | source-only high-confidence cleanup word |
| ATM | removed from source | source-only high-confidence cleanup word |
| B2B | removed from source | source-only high-confidence cleanup word |
| B2C | removed from source | source-only high-confidence cleanup word |
| B2G | removed from source | source-only high-confidence cleanup word |
| Bilibili | removed from source | source-only high-confidence cleanup word |
| BIM | removed from source | source-only high-confidence cleanup word |
| BPM | removed from source | source-only high-confidence cleanup word |
| CaaS | removed from source | source-only high-confidence cleanup word |
| CAD | removed from source | source-only high-confidence cleanup word |
| CAM | removed from source | source-only high-confidence cleanup word |
| CD | removed from source | source-only high-confidence cleanup word |
| CEO | removed from source | source-only high-confidence cleanup word |
| CET | removed from source | source-only high-confidence cleanup word |
| CFO | removed from source | source-only high-confidence cleanup word |
| CMM | removed from source | source-only high-confidence cleanup word |
| COO | removed from source | source-only high-confidence cleanup word |
| CRM | removed from source | source-only high-confidence cleanup word |
| CSS | removed from source | source-only high-confidence cleanup word |
| CST | removed from source | source-only high-confidence cleanup word |
| CT | removed from source | source-only high-confidence cleanup word |
| CTO | removed from source | source-only high-confidence cleanup word |
| DaaS | removed from source | source-only high-confidence cleanup word |
| DDoS | removed from source | source-only high-confidence cleanup word |
| DNA | removed from source | source-only high-confidence cleanup word |
| DOS | removed from source | source-only high-confidence cleanup word |
| DPI | removed from source | source-only high-confidence cleanup word |
| DPM | removed from source | source-only high-confidence cleanup word |
| DVD | removed from source | source-only high-confidence cleanup word |
| EPM | removed from source | source-only high-confidence cleanup word |
| ERP | removed from source | source-only high-confidence cleanup word |
| EST | removed from source | source-only high-confidence cleanup word |
| ETA | removed from source | source-only high-confidence cleanup word |
| FaaS | removed from source | source-only high-confidence cleanup word |
| FAQ | removed from source | source-only high-confidence cleanup word |
| FBI | removed from source | source-only high-confidence cleanup word |
| FPM | removed from source | source-only high-confidence cleanup word |
| GIF | removed from source | source-only high-confidence cleanup word |
| GMT | removed from source | source-only high-confidence cleanup word |
| GPM | removed from source | source-only high-confidence cleanup word |
| GPS | removed from source | source-only high-confidence cleanup word |
| HCM | removed from source | source-only high-confidence cleanup word |
| HD | removed from source | source-only high-confidence cleanup word |
| HR | removed from source | source-only high-confidence cleanup word |
| HTML | removed from source | source-only high-confidence cleanup word |
| IaaS | removed from source | source-only high-confidence cleanup word |
| IoT | removed from source | source-only high-confidence cleanup word |
| IP | removed from source | source-only high-confidence cleanup word |
| IPM | removed from source | source-only high-confidence cleanup word |
| IQ | removed from source | source-only high-confidence cleanup word |
| IST | removed from source | source-only high-confidence cleanup word |
| IT | removed from source | source-only high-confidence cleanup word |
| JPEG | removed from source | source-only high-confidence cleanup word |
| JPM | removed from source | source-only high-confidence cleanup word |
| KPI | removed from source | source-only high-confidence cleanup word |
| KPM | removed from source | source-only high-confidence cleanup word |
| LAN | removed from source | source-only high-confidence cleanup word |
| LPM | removed from source | source-only high-confidence cleanup word |
| MCM | removed from source | source-only high-confidence cleanup word |
| ML | removed from source | source-only high-confidence cleanup word |
| MRI | removed from source | source-only high-confidence cleanup word |
| MVP | removed from source | source-only high-confidence cleanup word |
| NFC | removed from source | source-only high-confidence cleanup word |
| NPM | removed from source | source-only high-confidence cleanup word |
| OPM | removed from source | source-only high-confidence cleanup word |
| P&L | removed from source | source-only high-confidence cleanup word |
| P2P | removed from source | source-only high-confidence cleanup word |
| PaaS | removed from source | source-only high-confidence cleanup word |
| PC | removed from source | source-only high-confidence cleanup word |
| PDF | removed from source | source-only high-confidence cleanup word |
| PNG | removed from source | source-only high-confidence cleanup word |
| PPM | removed from source | source-only high-confidence cleanup word |
| PST | removed from source | source-only high-confidence cleanup word |
| QPM | removed from source | source-only high-confidence cleanup word |
| QQ音乐 | removed from source | source-only high-confidence cleanup word |
| QR | removed from source | source-only high-confidence cleanup word |
| R&D | removed from source | source-only high-confidence cleanup word |
| RAM | removed from source | source-only high-confidence cleanup word |
| RNA | removed from source | source-only high-confidence cleanup word |
| ROI | removed from source | source-only high-confidence cleanup word |
| ROM | removed from source | source-only high-confidence cleanup word |
| RPA | removed from source | source-only high-confidence cleanup word |
| RPM | removed from source | source-only high-confidence cleanup word |
| SaaS | removed from source | source-only high-confidence cleanup word |
| SCM | removed from source | source-only high-confidence cleanup word |
| SD | removed from source | source-only high-confidence cleanup word |
| SDK | removed from source | source-only high-confidence cleanup word |
| SLA | removed from source | source-only high-confidence cleanup word |
| SOP | removed from source | source-only high-confidence cleanup word |
| SPM | removed from source | source-only high-confidence cleanup word |
| SQL | removed from source | source-only high-confidence cleanup word |
| T恤 | removed from source | source-only high-confidence cleanup word |
| TBA | removed from source | source-only high-confidence cleanup word |
| TBD | removed from source | source-only high-confidence cleanup word |
| TPM | removed from source | source-only high-confidence cleanup word |
| TV | removed from source | source-only high-confidence cleanup word |
| U盘 | removed from source | source-only high-confidence cleanup word |
| UI | removed from source | source-only high-confidence cleanup word |
| UPM | removed from source | source-only high-confidence cleanup word |
| URL | removed from source | source-only high-confidence cleanup word |
| USB | removed from source | source-only high-confidence cleanup word |
| UTC | removed from source | source-only high-confidence cleanup word |
| UV | removed from source | source-only high-confidence cleanup word |
| UX | removed from source | source-only high-confidence cleanup word |
| VIP | removed from source | source-only high-confidence cleanup word |
| VIP票 | removed from source | source-only high-confidence cleanup word |
| VPM | removed from source | source-only high-confidence cleanup word |
| VPN | removed from source | source-only high-confidence cleanup word |
| WAN | removed from source | source-only high-confidence cleanup word |
| WiFi | removed from source | source-only high-confidence cleanup word |
| WPM | removed from source | source-only high-confidence cleanup word |
| X光 | removed from source | source-only high-confidence cleanup word |
| XaaS | removed from source | source-only high-confidence cleanup word |
| XML | removed from source | source-only high-confidence cleanup word |
| XPM | removed from source | source-only high-confidence cleanup word |
| YPM | removed from source | source-only high-confidence cleanup word |
| ZPM | removed from source | source-only high-confidence cleanup word |
