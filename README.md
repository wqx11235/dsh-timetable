# 课表（一个只有课表的 Android App）

自己做的一个极简课表 App。**完全离线**：不联网、没有广告、没有统计、没有推送。

- 安装包：3.0 之后为 2.7 MB（内置 PDF / Excel / HTML 解析所需的全部资源）
- 自绘图标，单 Activity + WebView，课程数据存在 WebView 的 localStorage

## 下载

[![Release](https://img.shields.io/badge/下载-课表%205.3-3b6ef6)](https://github.com/wqx11235/dsh-timetable/releases/latest)

直接下载 APK：**[kebiao-5.3.apk](https://github.com/wqx11235/dsh-timetable/releases/download/v5.3/kebiao-5.3.apk)**（2.7 MB）

装好后打开 → ⋯ → 设置 → 管理课表 → **从文件导入**，选自己的课表 PDF / HTML / Excel 即可。

> 包内是**示例课表**，不是别人的真实数据；导入自己的课表会覆盖它。

## 功能

- 周次切换：左右滑动三页翻动（上一周 / 本周 / 下一周 同时滑动），也可点「第 N 周」直接跳
- 今天高亮、正在上的课有描边、「下一节」提示
- 非本周课程默认不显示；设置里可切「显示/隐藏」（显示时灰显标注「非本周」，且不会压住本周的课）
- 同一格多门课重叠时自动横向分栏，不叠字
- 点课程弹出详情卡：地点、教师、周次、教学班、考核、学分
- **配色**：12 色板按课程顺序分配，不同课不同色，同一门课颜色固定
- 自定义壁纸：填充方式（铺满/完整）、缩放、上下位置、透明度、遮罩
- 设置页：开学日期、本周是第几周、总周数、作息时间（含「上午 4 节 / 5 节」一键预设）
- 课表管理：手动增删改、分享码导入导出、PDF / Excel / CSV / HTML 导入、清空、恢复内置
- 没有固定节次的实践课（`共N周`）单独列在课表下方「其他安排」
- 返回手势：先关浮层，回到课表，再返回才退出

## 目录

| 路径 | 说明 |
|---|---|
| `app/src/com/kebiao/local/MainActivity.java` | 唯一的 Java 代码，WebView 壳 + 文件选择（PDF/HTML/Excel/图片） |
| `app/assets/index.html` | 整个界面（单文件，数据已内联） |
| `app/assets/vendor/` | pdf.js、SheetJS、中文 cmaps 及其内嵌数据（第三方，见下） |
| `app/res/drawable/ic_launcher.png` | 图标（脚本生成） |
| `app/build.sh` | 打包脚本：aapt + javac + d8 + zipalign + apksigner |
| `tools/gen.py` | 把模板和数据合成为 index.html |
| `tools/kb.tpl.html` | 页面模板（改界面改这个） |
| `tools/parse_pdf.py` / `parse_pdf.mjs` | 解析课表 PDF 的参考实现 |
| `data/courses.json` | 示例课表数据（占位，无真实信息） |

## 自己构建

需要：JDK 17、Android SDK 的 `android.jar`、`aapt`、`zipalign`、`apksigner`、`d8`。

```bash
python3 tools/gen.py            # 生成 app/assets/index.html
cd app && bash build.sh         # 产出 kebiao.apk（自签名）
```

- `build.sh` 里的 `ANDROID_JAR` / `D8_JAR` 用环境变量覆盖，缺了会直接报错退出
- 模板里 `/*__VER__*/` 是版本号、`/*__KIND__*/` 是默认作息（`m4`=上午 4 节，`m5`=上午 5 节），`/*__DATA__*/` 是课表数据

## 课表从哪来

1. **PDF**：教务系统（正方 jwglxt）导出的课表 PDF。做法是**按 PDF 原始文字顺序**识别 `(A-B节)`、`周次`、`学分` 等片段，再用文字所在坐标判定属于星期几。这样即使 WebView 里 pdf.js 把文字拆成几百个碎片，也不会串行（3.x 之前按列拼接时会出这个问题）
2. **HTML**：教务系统网页版导出的课表，按表格结构解析（认星期表头、合并单元格、节次行）
3. **Excel / CSV**：有表头就自动认列（课程名/星期/节次/周次/地点/教师…），没有就按固定列序读
4. **分享码**：一行一门课，`课程名|星期|起始节|结束节|周次|地点|教师|校区|考核|学分`
5. **手动**：App 内增删改

## 第三方库

`app/assets/vendor/` 里是第三方发行版文件：

- pdf.js 2.16.105（Apache-2.0）— `pdf.min.js`、`pdf.worker.min.js`、`cmaps/`
  - 打了两个小补丁：读取字符表时优先用内嵌数据 `cmaps-data.js`（`file://` 下取不到 `.bcmap` 文件）
- SheetJS xlsx 0.18.5（Apache-2.0）— `xlsx.min.js`

## 说明

课表数据来自各校教务系统，App 只做本地解析与展示，不上传任何数据；名称、图标、代码均为原创。
