var fs = require("fs");
var request = require("request");
var _ = require("lodash");

module.exports = function(core){

    var cloud = {
        enabled: function(fn){
            fs.exists([process.env.HOME, ".containership", "cloud.json"].join("/"), function(exists){
                return fn(exists);
            });
        },

        get_credentials: function(fn){
            fs.readFile([process.env.HOME, ".containership", "cloud.json"].join("/"), function(err, contents){
                if(err)
                    return fn(err);

                try{
                    var credentials = JSON.parse(contents);
                    return fn(null, credentials);
                }
                catch(err){
                    return fn(err);
                }
            });
        },

        api: {
            base_url: "https://api.containership.io",
            version: "v1"
        }
    }

    return {

        get_schedule: function(fn){
            cloud.enabled(function(enabled){
                if(!enabled)
                    return fn(new Error("Cloud Plugin not configured!"));
                else{
                    cloud.get_credentials(function(err, credentials){
                        if(err)
                            return fn(err);

                        var options = {
                            url: [cloud.api.base_url, cloud.api.version, credentials.organization, "clusters", core.options["cluster-id"]].join("/"),
                            method: "GET",
                            json: true,
                            headers: {
                                "x-containership-cloud-api-key": credentials.api_key,
                                "x-containership-cloud-organization": credentials.organization
                            }
                        }

                        request(options, function(err, response){
                            if(err)
                                return fn(err);
                            else if(response.statusCode != 200)
                                return fn(new Error(["Cluster returned", response.statusCode, "from ContainerShip Cloud API"].join(" ")));
                            else if(!_.has(response.body, "upgrade"))
                                return fn(new Error("Auto-upgrade not configured!"));
                            else
                                return fn(null, response.body.upgrade);
                        });
                    });
                }
            });
        }
    }

}
