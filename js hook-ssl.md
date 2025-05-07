# 一、PC安装frida和frida-tools
pip install frida                或者pip install frida==16.0.18
pip install frida-tools            或者pip install frida-tools==12.1.2
卸载
pip uninstall frida
pip uninstall frida-tools

# 二、手机端安装frida-server
https://github.com/frida/frida/releases?page=1
frida-server版本要和上面PC端安装的frida版本一致
将frida-server包解压后push到手机上
adb push frida-server-16.0.18-android-arm64 /data/local/tmp
adb shell
su   //如果已经是root就不必执行了，命令id可以查看是否是root
cd /data/local/tmp
mv frida-server-16.0.18-android-arm64 frida-server-16.0.18  //重命名一下
chmod 777 frida-server-16.0.18  //改下文件权限
启动./frida-server-16.0.18
server成功运行后，使用再起一个cmd窗口，运行frida-ps -U 或者frida-ps -R来检查是否可以成功查看手机进程

· 问题解决：
1、启动frida-server提示：Unable to save SELinux policy to the kernel: Out of memory Segmentation fault   
在adb shell中执行：
HWSEA:/data/local/tmp # setenforce 0
HWSEA:/data/local/tmp # getenforce
Permissive
然后再次运行frida-server即可

2、执行frida-ps -U 提示：Waiting for USB device to appear 
启动frida-server之后，使用adb forward 进行端口转发：
adb forward tcp:27042 tcp:27042
adb forward tcp:27043 tcp:27043
然后使用frida-ps -R 连接手机

# 三、使用frida-skeleton配合BurpSuite抓包
可以自动绕过证书绑定校验(SSL pinning)：SSL Pinning 指的是，对于 target sdk version > 23 的 Android App，App 默认指信任系统的根证书或 App 内指定的证书，而不信任用户添加的第三方证书。这会导致我们在对 App 做逆向分析的时候，使用 Charles等工具无法抓 https 包
frida-skeleton是基于frida的安卓hook框架，提供了很多frida自身不支持的功能，将hook安卓变成简单便捷
克隆本项目到本地
git clone https://github.com/Margular/frida-skeleton.git

· 1、安装第三方依赖库
进入frida-skeleton-master目录下,打开cmd，使用pip命令安装：pip install -r requirements.txt

· 2、命令启动
进入到frida-skeleton-master目录下使用python frida-skeleton.py -vip 8080 包名（app包名）命令启动即可。
# 例：针对io.github.margular进行抓包
python frida-skeleton.py -vip 8080 io.github.margular
# 部分匹配也可
python frida-skeleton.py -vip 8080 margular
# 精准匹配
python frida-skeleton.py -vip 8080 ^io\.github\.margular$
# 支持多个参数，以下会hook所有包名里面有margular或者google的app
python frida-skeleton.py -vip 8080 margular google

· 3、burp设置代理和端口，设置透明代理且端口要和-p指定的一致

# 四、frida+一键hook脚本绕过SSL Pining
使用一键Hook脚本 hook-ssl.js
frida.exe -U -f cn.myapp.android -l  C:\Users\admin\Desktop\app\hook-ssl.js  --no-pause

hook-ssl.js

```javascript
Java.perform(function() {
/*
hook list:
1.SSLcontext
2.okhttp
3.webview
4.XUtils
5.httpclientandroidlib
6.JSSE
7.network\_security\_config (android 7.0+)
8.Apache Http client (support partly)
9.OpenSSLSocketImpl
10.TrustKit
11.Cronet
*/
    // Attempts to bypass SSL pinning implementations in a number of
    // ways. These include implementing a new TrustManager that will
    // accept any SSL certificate, overriding OkHTTP v3 check()
    // method etc.
    var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
    var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
    var SSLContext = Java.use('javax.net.ssl.SSLContext');
    var quiet_output = false;
    // Helper method to honor the quiet flag.
    function quiet_send(data) {
        if (quiet_output) {
            return;
        }
        send(data)
    }
    // Implement a new TrustManager
    // ref: https://gist.github.com/oleavr/3ca67a173ff7d207c6b8c3b0ca65a9d8
    // Java.registerClass() is only supported on ART for now(201803). 所以android 4.4以下不兼容,4.4要切换成ART使用.
    /*
06-07 16:15:38.541 27021-27073/mi.sslpinningdemo W/System.err: java.lang.IllegalArgumentException: Required method checkServerTrusted(X509Certificate[], String, String, String) missing
06-07 16:15:38.542 27021-27073/mi.sslpinningdemo W/System.err:     at android.net.http.X509TrustManagerExtensions.<init>(X509TrustManagerExtensions.java:73)
        at mi.ssl.MiPinningTrustManger.<init>(MiPinningTrustManger.java:61)
06-07 16:15:38.543 27021-27073/mi.sslpinningdemo W/System.err:     at mi.sslpinningdemo.OkHttpUtil.getSecPinningClient(OkHttpUtil.java:112)
        at mi.sslpinningdemo.OkHttpUtil.get(OkHttpUtil.java:62)
        at mi.sslpinningdemo.MainActivity$1$1.run(MainActivity.java:36)
*/
    var X509Certificate = Java.use("java.security.cert.X509Certificate");
    var TrustManager;
    try {
        TrustManager = Java.registerClass({
            name: 'org.wooyun.TrustManager',
            implements: [X509TrustManager],
            methods: {
                checkClientTrusted: function(chain, authType) {},
                checkServerTrusted: function(chain, authType) {},
                getAcceptedIssuers: function() {
                    // var certs = [X509Certificate.$new()];
                    // return certs;
                    return [];
                }
            }
        });
    } catch (e) {
        quiet_send("registerClass from X509TrustManager >>>>>>>> " + e.message);
    }
    // Prepare the TrustManagers array to pass to SSLContext.init()
    var TrustManagers = [TrustManager.$new()];
    try {
        // Prepare a Empty SSLFactory
        var TLS_SSLContext = SSLContext.getInstance("TLS");
        TLS_SSLContext.init(null, TrustManagers, null);
        var EmptySSLFactory = TLS_SSLContext.getSocketFactory();
    } catch (e) {
        quiet_send(e.message);
    }
    send('Custom, Empty TrustManager ready');
    // Get a handle on the init() on the SSLContext class
    var SSLContext_init = SSLContext.init.overload(
        '[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');
    // Override the init method, specifying our new TrustManager
    SSLContext_init.implementation = function(keyManager, trustManager, secureRandom) {
        quiet_send('Overriding SSLContext.init() with the custom TrustManager');
        SSLContext_init.call(this, null, TrustManagers, null);
    };
    /*** okhttp3.x unpinning ***/
    // Wrap the logic in a try/catch as not all applications will have
    // okhttp as part of the app.
    try {
        var CertificatePinner = Java.use('okhttp3.CertificatePinner');
        quiet_send('OkHTTP 3.x Found');
        CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function() {
            quiet_send('OkHTTP 3.x check() called. Not throwing an exception.');
        }
    } catch (err) {
        // If we dont have a ClassNotFoundException exception, raise the
        // problem encountered.
        if (err.message.indexOf('ClassNotFoundException') === 0) {
            throw new Error(err);
        }
    }
    // Appcelerator Titanium PinningTrustManager
    // Wrap the logic in a try/catch as not all applications will have
    // appcelerator as part of the app.
    try {
        var PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');
        send('Appcelerator Titanium Found');
        PinningTrustManager.checkServerTrusted.implementation = function() {
            quiet_send('Appcelerator checkServerTrusted() called. Not throwing an exception.');
        }
    } catch (err) {
        // If we dont have a ClassNotFoundException exception, raise the
        // problem encountered.
        if (err.message.indexOf('ClassNotFoundException') === 0) {
            throw new Error(err);
        }
    }
    /*** okhttp unpinning ***/
    try {
        var OkHttpClient = Java.use("com.squareup.okhttp.OkHttpClient");
        OkHttpClient.setCertificatePinner.implementation = function(certificatePinner) {
            // do nothing
            quiet_send("OkHttpClient.setCertificatePinner Called!");
            return this;
        };
        // Invalidate the certificate pinnet checks (if "setCertificatePinner" was called before the previous invalidation)
        var CertificatePinner = Java.use("com.squareup.okhttp.CertificatePinner");
        CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function(p0, p1) {
            // do nothing
            quiet_send("okhttp Called! [Certificate]");
            return;
        };
        CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(p0, p1) {
            // do nothing
            quiet_send("okhttp Called! [List]");
            return;
        };
    } catch (e) {
        quiet_send("com.squareup.okhttp not found");
    }
    /*** WebView Hooks ***/
    /* frameworks/base/core/java/android/webkit/WebViewClient.java */
    /* public void onReceivedSslError(Webview, SslErrorHandler, SslError) */
    var WebViewClient = Java.use("android.webkit.WebViewClient");
    WebViewClient.onReceivedSslError.implementation = function(webView, sslErrorHandler, sslError) {
        quiet_send("WebViewClient onReceivedSslError invoke");
        //执行proceed方法
        sslErrorHandler.proceed();
        return;
    };
    WebViewClient.onReceivedError.overload('android.webkit.WebView', 'int', 'java.lang.String', 'java.lang.String').implementation = function(a, b, c, d) {
        quiet_send("WebViewClient onReceivedError invoked");
        return;
    };
    WebViewClient.onReceivedError.overload('android.webkit.WebView', 'android.webkit.WebResourceRequest', 'android.webkit.WebResourceError').implementation = function() {
        quiet_send("WebViewClient onReceivedError invoked");
        return;
    };
    /*** JSSE Hooks ***/
    /* libcore/luni/src/main/java/javax/net/ssl/TrustManagerFactory.java */
    /* public final TrustManager[] getTrustManager() */
    /* TrustManagerFactory.getTrustManagers maybe cause X509TrustManagerExtensions error  */
    // var TrustManagerFactory = Java.use("javax.net.ssl.TrustManagerFactory");
    // TrustManagerFactory.getTrustManagers.implementation = function(){
    //     quiet_send("TrustManagerFactory getTrustManagers invoked");
    //     return TrustManagers;
    // }
    var HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
    /* libcore/luni/src/main/java/javax/net/ssl/HttpsURLConnection.java */
    /* public void setDefaultHostnameVerifier(HostnameVerifier) */
    HttpsURLConnection.setDefaultHostnameVerifier.implementation = function(hostnameVerifier) {
        quiet_send("HttpsURLConnection.setDefaultHostnameVerifier invoked");
        return null;
    };
    /* libcore/luni/src/main/java/javax/net/ssl/HttpsURLConnection.java */
    /* public void setSSLSocketFactory(SSLSocketFactory) */
    HttpsURLConnection.setSSLSocketFactory.implementation = function(SSLSocketFactory) {
        quiet_send("HttpsURLConnection.setSSLSocketFactory invoked");
        return null;
    };
    /* libcore/luni/src/main/java/javax/net/ssl/HttpsURLConnection.java */
    /* public void setHostnameVerifier(HostnameVerifier) */
    HttpsURLConnection.setHostnameVerifier.implementation = function(hostnameVerifier) {
        quiet_send("HttpsURLConnection.setHostnameVerifier invoked");
        return null;
    };
    /*** Xutils3.x hooks ***/
    //Implement a new HostnameVerifier
    var TrustHostnameVerifier;
    try {
        TrustHostnameVerifier = Java.registerClass({
            name: 'org.wooyun.TrustHostnameVerifier',
            implements: [HostnameVerifier],
            method: {
                verify: function(hostname, session) {
                    return true;
                }
            }
        });
    } catch (e) {
        //java.lang.ClassNotFoundException: Didn't find class "org.wooyun.TrustHostnameVerifier"
        quiet_send("registerClass from hostnameVerifier >>>>>>>> " + e.message);
    }
    try {
        var RequestParams = Java.use('org.xutils.http.RequestParams');
        RequestParams.setSslSocketFactory.implementation = function(sslSocketFactory) {
            sslSocketFactory = EmptySSLFactory;
            return null;
        }
        RequestParams.setHostnameVerifier.implementation = function(hostnameVerifier) {
            hostnameVerifier = TrustHostnameVerifier.$new();
            return null;
        }
    } catch (e) {
        quiet_send("Xutils hooks not Found");
    }
    /*** httpclientandroidlib Hooks ***/
    try {
        var AbstractVerifier = Java.use("ch.boye.httpclientandroidlib.conn.ssl.AbstractVerifier");
        AbstractVerifier.verify.overload('java.lang.String', '[Ljava.lang.String', '[Ljava.lang.String', 'boolean').implementation = function() {
            quiet_send("httpclientandroidlib Hooks");
            return null;
        }
    } catch (e) {
        quiet_send("httpclientandroidlib Hooks not found");
    }
    /***
android 7.0+ network_security_config TrustManagerImpl hook
apache httpclient partly
***/
    var TrustManagerImpl = Java.use("com.android.org.conscrypt.TrustManagerImpl");
    // try {
    //     var Arrays = Java.use("java.util.Arrays");
    //     //apache http client pinning maybe baypass
    //     //https://github.com/google/conscrypt/blob/c88f9f55a523f128f0e4dace76a34724bfa1e88c/platform/src/main/java/org/conscrypt/TrustManagerImpl.java#471
    //     TrustManagerImpl.checkTrusted.implementation = function (chain, authType, session, parameters, authType) {
    //         quiet_send("TrustManagerImpl checkTrusted called");
    //         //Generics currently result in java.lang.Object
    //         return Arrays.asList(chain);
    //     }
    //
    // } catch (e) {
    //     quiet_send("TrustManagerImpl checkTrusted nout found");
    // }
    try {
        // Android 7+ TrustManagerImpl
        TrustManagerImpl.verifyChain.implementation = function(untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
            quiet_send("TrustManagerImpl verifyChain called");
            // Skip all the logic and just return the chain again :P
            //https://www.nccgroup.trust/uk/about-us/newsroom-and-events/blogs/2017/november/bypassing-androids-network-security-configuration/
            // https://github.com/google/conscrypt/blob/c88f9f55a523f128f0e4dace76a34724bfa1e88c/platform/src/main/java/org/conscrypt/TrustManagerImpl.java#L650
            return untrustedChain;
        }
    } catch (e) {
        quiet_send("TrustManagerImpl verifyChain nout found below 7.0");
    }
    // OpenSSLSocketImpl
    try {
        var OpenSSLSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLSocketImpl');
        OpenSSLSocketImpl.verifyCertificateChain.implementation = function(certRefs, authMethod) {
            quiet_send('OpenSSLSocketImpl.verifyCertificateChain');
        }
        quiet_send('OpenSSLSocketImpl pinning')
    } catch (err) {
        quiet_send('OpenSSLSocketImpl pinner not found');
    }
    // Trustkit
    try {
        var Activity = Java.use("com.datatheorem.android.trustkit.pinning.OkHostnameVerifier");
        Activity.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function(str) {
            quiet_send('Trustkit.verify1: ' + str);
            return true;
        };
        Activity.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function(str) {
            quiet_send('Trustkit.verify2: ' + str);
            return true;
        };
        quiet_send('Trustkit pinning')
    } catch (err) {
        quiet_send('Trustkit pinner not found')
    }
    try {
        //cronet pinner hook
        //weibo don't invoke
        var netBuilder = Java.use("org.chromium.net.CronetEngine$Builder");
        //https://developer.android.com/guide/topics/connectivity/cronet/reference/org/chromium/net/CronetEngine.Builder.html#enablePublicKeyPinningBypassForLocalTrustAnchors(boolean)
        netBuilder.enablePublicKeyPinningBypassForLocalTrustAnchors.implementation = function(arg) {
            //weibo not invoke
            console.log("Enables or disables public key pinning bypass for local trust anchors = " + arg);
            //true to enable the bypass, false to disable.
            var ret = netBuilder.enablePublicKeyPinningBypassForLocalTrustAnchors.call(this, true);
            return ret;
        };
        netBuilder.addPublicKeyPins.implementation = function(hostName, pinsSha256, includeSubdomains, expirationDate) {
            console.log("cronet addPublicKeyPins hostName = " + hostName);
            //var ret = netBuilder.addPublicKeyPins.call(this,hostName, pinsSha256,includeSubdomains, expirationDate);
            //this 是调用 addPublicKeyPins 前的对象吗? Yes,CronetEngine.Builder
            return this;
        };
    } catch (err) {
        console.log('[-] Cronet pinner not found')
    }
});
```
