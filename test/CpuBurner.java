package io.split.dbm.demo.splitOnJava;

import java.time.Instant;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import io.split.client.SplitClient;
import io.split.client.SplitClientConfig;
import io.split.client.SplitFactoryBuilder;

public class CpuBurner {

	public static void
	main(String[] args) throws Exception {
		SplitClientConfig config = SplitClientConfig.builder()
				.setBlockUntilReadyTimeout(5000)
				.build();

		Instant now = Instant.now();
		final SplitClient split = SplitFactoryBuilder.build("3jueh9a4g1ksklep3f910s131abaj4sfo8mm", config).client();
		split.blockUntilReady();
		System.out.println("SDK ready in " + (Instant.now().toEpochMilli() - now.toEpochMilli()) + "ms");
		
		ScheduledExecutorService scheduledThreadPool = Executors.newScheduledThreadPool(2);

		scheduledThreadPool.scheduleAtFixedRate(new Runnable() {

			@Override
			public void run() {
				String treatment = split.getTreatment("dmartin", "sg_multiplexer");
				if(treatment.equalsIgnoreCase("v3")) {
					Instant startBurn = Instant.now();
					for(int i = 0; i < (Integer.MAX_VALUE / 4); i++) {
						@SuppressWarnings("unused")
						double j = Math.cos(Math.PI);
					}
					System.out.println("burn: " + (Instant.now().toEpochMilli() - startBurn.toEpochMilli()));
				} else {
					System.out.println(".");
				}
			}
			
		}, 100, 100, TimeUnit.MILLISECONDS);
		
		
	}

}
