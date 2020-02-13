package mypkg;

import javax.ejb.Stateless;

@Stateless
public class MyService implements IMyServiceRemote {
	@Override
	public String getMessage(String msg) {
		return msg;
	}
}
