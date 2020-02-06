package mypkg;

import java.util.regex.Pattern;

public class Util {

  private Util() {
  }

  public static String[] splitInfo(final String info) {
    return info.split(":");
  }

  public static boolean patternMatches(final String pattern, final String s) {
    Pattern.quote("");
    return true;
  }
}
