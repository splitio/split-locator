package io.split.dbm.demo.splitOnJava;

import org.json.JSONArray;
import org.json.JSONObject;

import io.split.client.SplitClient;
import io.split.client.SplitClientConfig;
import io.split.client.SplitFactoryBuilder;
import io.split.client.api.SplitResult;

public class MultivariantName {

	public static void
	main(String[] args) throws Exception {

		SplitClientConfig config = SplitClientConfig.builder()
				.setBlockUntilReadyTimeout(5000)
				.build();

		SplitClient split = SplitFactoryBuilder.build("3jueh9a4g1ksklep3f910s131abaj4sfo8mm", config).client();
		split.blockUntilReady();

		SplitResult result = split.getTreatmentWithConfig("user_id", // unique identifier for your user
				"z_on_another_line");

		JSONObject configObj = new JSONObject(result.config());
		JSONArray namesArray = configObj.getJSONArray("names");
		System.out.println(namesArray.toString());
	}

}
