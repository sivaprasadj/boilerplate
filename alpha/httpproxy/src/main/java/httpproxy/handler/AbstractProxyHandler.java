package httpproxy.handler;

import httpproxy.core.HttpHandler;

/**
 * AbstractProxyHandler
 * @author kazuhiko arase
 */
public abstract class AbstractProxyHandler implements HttpHandler {
  private String targetHost;
  private int targetPort;
  private boolean targetProxy;
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
  public boolean isTargetProxy() {
    return targetProxy;
  }
  public void setTargetProxy(boolean targetProxy) {
    this.targetProxy = targetProxy;
  }
}
