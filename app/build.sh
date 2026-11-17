#!/bin/bash
set -euo pipefail
cd $(cd "$(dirname "$0")" && pwd)
# 按自己的 Android SDK 改；也可以用环境变量传进来
ANDROID_JAR="${ANDROID_JAR:-/root/android/android-34/android.jar}"
D8_JAR="${D8_JAR:-/root/android/android-14/lib/d8.jar}"
for f in "$ANDROID_JAR" "$D8_JAR"; do
  if [ ! -f "$f" ]; then
    echo "找不到 $f，请用环境变量指定" >&2; exit 1
  fi
done

rm -rf build && mkdir -p build/classes build/dex build/gen

# 1) 资源 + 清单 + assets 打包（aapt v1，arm64 原生）
aapt package -f -M AndroidManifest.xml -S res -A assets -I "$ANDROID_JAR" -F build/base.apk

# 2) 编译 Java
javac -source 8 -target 8 -nowarn -cp "$ANDROID_JAR" -d build/classes \
  src/com/kebiao/local/MainActivity.java

# 3) 转 dex（d8 是纯 Java 实现，能在 arm64 上跑）
java -cp "$D8_JAR" com.android.tools.r8.D8 --min-api 23 --lib "$ANDROID_JAR" \
  --output build/dex $(find build/classes -name '*.class')

# 4) 把 classes.dex 塞进 apk
cd build/dex && zip -q ../base.apk classes.dex && cd ../..

# 5) 对齐 + 签名
zipalign -f 4 build/base.apk build/aligned.apk
if [ ! -f ko.jks ]; then
  keytool -genkeypair -keystore ko.jks -storepass kebiao123 -keypass kebiao123 \
    -alias kebiao -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Kebiao, O=Local" >/dev/null 2>&1
fi
apksigner sign --ks ko.jks --ks-pass pass:kebiao123 --key-pass pass:kebiao123 \
  --v1-signing-enabled true --v2-signing-enabled true \
  --out kebiao.apk build/aligned.apk
apksigner verify --print-certs kebiao.apk | head -4
ls -lh kebiao.apk
