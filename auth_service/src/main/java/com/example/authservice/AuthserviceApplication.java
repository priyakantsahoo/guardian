package com.example.authservice;

import com.example.authservice.config.EnvironmentConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AuthserviceApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(AuthserviceApplication.class);
		app.addInitializers(new EnvironmentConfig());
		app.run(args);
	}

}
