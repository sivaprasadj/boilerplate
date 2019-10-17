package httpproxy.core;

import java.util.LinkedHashMap;
import java.util.Map;

public class Util {

  private Util() {
  }

  public static final Map<?,?> map(final Object... o) {
    final Map<Object,Object> map = new LinkedHashMap<Object, Object>();
    for (int i = 0; i < o.length; i += 2) {
      map.put(o[i], o[i + 1]);
    }
    return map;
  }
}
