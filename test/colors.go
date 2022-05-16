package main

import (
	"strings"
	"fmt"
	"io"
 	"net/http"
  	"encoding/json"
	"github.com/splitio/go-client/v6/splitio/client"
    	"github.com/splitio/go-client/v6/splitio/conf"
	"github.com/google/uuid"
 )

type MyConfiguration struct {
	Route string
}

func main() {
 	fmt.Println("Golang Split with Dynamic Config and HTTP routing")

	cfg := conf.Default()
	factory, err := client.NewSplitFactory("3jueh9a4g1ksklep3f910s131abaj4sfo8mm", cfg)

	if err != nil {
		fmt.Printf("SDK init error: %s\n", err.Error())
		return
	}

	client := factory.Client()
	err = client.BlockUntilReady(10)

	if err != nil {
		fmt.Printf("SDK timeout: %s\n", err.Error())
		return
	}

	uuid := uuid.New()
        key := uuid.String()
	fmt.Println(key)

	result := client.TreatmentWithConfig(
		 key, // unique id for your user
		 "color_router", // unique name for your split
		 nil)
  	fmt.Printf("result.Config: " + *result.Config + "\n");

	var config MyConfiguration // User custom configuration structure
	if result.Config != nil {
		err = json.Unmarshal([]byte(*result.Config), &config)
		if err != nil {
			fmt.Println("Error:", err.Error())
		}
	}
	treatment := result.Treatment
	fmt.Printf("treatment: %s\n", treatment)
	fmt.Printf("route: %s\n", config.Route)
	
	httpClient := &http.Client{}
	httpReq, _ := http.NewRequest("POST", "https://m3np3r72a3.execute-api.us-west-2.amazonaws.com/prod", strings.NewReader("{\"key\": \"" + key + "\"}"))
        httpReq.Header.Set("color", treatment)
	httpReq.Header.Set("split-route", config.Route)
	httpReq.Header.Set("Content-Type", "application/json")
	httpRes, _ := httpClient.Do(httpReq)
	defer httpRes.Body.Close()
	body, _ := io.ReadAll(httpRes.Body);

	fmt.Printf("response body: " + string(body) + "\n");

}
