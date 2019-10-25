package httpproxy.handler;

import httpproxy.core.HttpHandler;

/**
 * AbstractProxyHandler
 * @author kazuhiko arase
 */
/**
 * @author J205
 *
 */
public abstract class AbstractProxyHandler implements HttpHandler {
  private String targetHost;
  private int targetPort;
  private boolean useProxy;
  protected AbstractProxyHandler() {
  }
  public String getTargetHost() {
    return targetHost;
  }
  public void setTargetHost(String targetHost) {
    this.targetHost = targetHost;
  }
  public int getTargetPort() {
    return targetPort;
  }
  public void setTargetPort(int targetPort) {
    this.targetPort = targetPort;
  }
  public boolean isUseProxy() {
    return useProxy;
  }
  public void setUseProxy(boolean useProxy) {
    this.useProxy = useProxy;
  }
}
