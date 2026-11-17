# 课表（一个只有课表的 Android App）

自己做的一个极简课表 App，用来替代带广告的「超级课程表」。**完全离线**：不联网、没有广告、没有统计、没有推送。

- 安装包：2.0 版 25 KB（分享码导入）／2.1 版 1.7 MB（带 PDF / Excel 导入）
- 自绘图标，单 Activity + WebView，课程数据存在 WebView 的 localStorage

## 下载

[![Release](https://img.shields.io/badge/下载-课表%202.1-3b6ef6)](https://github.com/wqx11235/dsh-timetable/releases/latest)

直接下载 APK：**[kebiao-2.1.apk](https://github.com/wqx11235/dsh-timetable/releases/download/v2.1/kebiao-2.1.apk)**（1.7 MB）

装好后打开 → ⋯ → 设置 → 管理课表 → **从文件导入**，选自己的课表 PDF 即可。

> 也提供 25 KB 的精简版思路：删掉 `app/assets/vendor/` 与文件导入入口，只保留分享码导入。

## 功能

- 周次切换：左右滑动三页翻动（上一周 / 本周 / 下一周 同时滑动），也可点「第 N 周」直接跳
- 今天高亮、正在上的课有描边、「下一节」提示
- 不属于本周的课灰显并标注「非本周」
- 点课程弹出详情卡：地点、教师、周次、教学班、考核、学分
- 自定义壁纸：填充方式（铺满/完整）、缩放、上下位置、透明度、遮罩
- 设置页：开学日期、总周数、12 节作息时间可改
- 课表管理：手动增删改课程；分享码导入导出；PDF / Excel / CSV 导入
- 返回手势：先关浮层，回到课表，再返回才退出

## 目录

| 路径 | 说明 |
|---|---|
| `app/src/com/kebiao/local/MainActivity.java` | 唯一的 Java 代码，WebView 壳 + 文件选择 |
| `app/assets/index.html` | 整个界面（单文件，数据已内联） |
| `app/assets/vendor/` | pdf.js、SheetJS、中文 cmaps（第三方，见下） |
| `app/res/drawable/ic_launcher.png` | 图标（脚本生成） |
| `app/build.sh` | 打包脚本：aapt + javac + d8 + zipalign + apksigner |
| `tools/gen.py` | 把模板和数据合成为 index.html |
| `tools/parse_pdf.py` | 用 Python 解析教务系统课表 PDF（参考实现） |
| `tools/kb.tpl.html` | 页面模板（改界面改这个） |
| `data/courses.json` | 示例课表数据 |

## 自己构建

需要：JDK 17、Android SDK 的 `android.jar`、`aapt`、`zipalign`、`apksigner`、`d8`。

```bash
python3 tools/gen.py            # 生成 app/assets/index.html
cd app && bash build.sh         # 产出 kebiao.apk（自签名）
```

`build.sh` 里 `ANDROID_JAR` 和 `D8_JAR` 是绝对路径，按自己环境改。

## 课表从哪来

1. **PDF**：教务系统（正方 jwglxt）导出的课表 PDF，按「星期一…星期日」表头定位 7 列，用坐标把折行拼回，再按「学分」切分课程
2. **Excel / CSV**：有表头就自动认列（课程名/星期/节次/周次/地点/教师…），没有就按固定列序读
3. **分享码**：一行一门课，`课程名|星期|起始节|结束节|周次|地点|教师|校区|考核|学分`
4. **手动**：App 内增删改

## 第三方库

`app/assets/vendor/` 里是原封不动的发行版文件：

- pdf.js 2.16.105（Apache-2.0）— `pdf.min.js`、`pdf.worker.min.js`、`cmaps/`
- SheetJS xlsx 0.18.5（Apache-2.0）— `xlsx.min.js`

## 说明

数据来自学校教务系统，仅供个人使用；没有使用「超级课程表」的名称、图标或代码。
