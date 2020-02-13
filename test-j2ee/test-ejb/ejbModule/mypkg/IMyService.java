package mypkg;

import javax.ejb.Local;

@Local
public interface IMyService {
	String getMessage(String msg);
}
