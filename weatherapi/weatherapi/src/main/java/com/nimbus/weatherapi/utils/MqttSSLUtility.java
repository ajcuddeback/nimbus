package com.nimbus.weatherapi.utils;

import org.bouncycastle.jce.provider.BouncyCastleProvider;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManagerFactory;
import java.io.BufferedInputStream;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.Security;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

public class MqttSSLUtility {
    // one-way ssl/tls
    public static SSLSocketFactory getSingleSocketFactory(final String caCrtFile) throws Exception {
        // TODO: There are vulnerabilities in BouncyCastle. Look and see if there is a newer version or a different provider
        Security.addProvider(new BouncyCastleProvider());
        X509Certificate caCert = null;

        FileInputStream caCrtFileInputStream = new FileInputStream(caCrtFile);

        BufferedInputStream bis = new BufferedInputStream(caCrtFileInputStream);
        CertificateFactory cf = CertificateFactory.getInstance("X.509");

        while (bis.available() > 0) {
            caCert = (X509Certificate) cf.generateCertificate(bis);
        }
        KeyStore caKs = KeyStore.getInstance(KeyStore.getDefaultType());
        caKs.load(null, null);
        caKs.setCertificateEntry("cert-certificate", caCert);
        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        tmf.init(caKs);
        SSLContext sslContext = SSLContext.getInstance("TLSv1.2");
        sslContext.init(null, tmf.getTrustManagers(), null);
        return sslContext.getSocketFactory();
    }
}
