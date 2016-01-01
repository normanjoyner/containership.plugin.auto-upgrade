var npm = require("npm");
var semver = require("semver");
var _ = require("lodash");

module.exports = function(core){

    return {

        attempt: function(options){
            var self = this;

            var splay = (Math.random() * options.max_splay) + 1;

            setTimeout(function(){
                core.loggers["auto-upgrade"].log("verbose", "Attemping to automatically upgrade ContainerShip!");

                npm.load({
                    global: true,
                    "unsafe-perm": true
                }, function(){
                    npm.commands.info(["containership"], { json: true }, function(err, data){
                        if(err)
                            core.loggers["auto-upgrade"].log("warn", "Failed to fetch latest available ContainerShip version from npm!");
                        else{
                            var version = _.first(_.keys(data));
                            if(semver.gt(version, options.version)){
                                npm.commands.install([["containership", version].join("@")], function(err){
                                    if(err)
                                        core.loggers["auto-upgrade"].log("warn", ["Failed to upgrade to ContainerShip", version].join(" "));
                                    else{
                                        core.loggers["auto-upgrade"].log("verbose", ["Successfully upgraded to ContainerShip", version].join(" "));
                                        core.loggers["auto-upgrade"].log("info", "Restarting ContainerShip in 15 seconds to complete upgrade ...");
                                        setTimeout(function(){
                                            core.loggers["auto-upgrade"].log("info", "Shutting down now!");
                                            process.exit(0);
                                        }, 15000);
                                    }
                                });
                            }
                            else
                                core.loggers["auto-upgrade"].log("debug", "Already running the latest version of ContainerShip!");
                        }
                    });
                });
            }, splay);
        }

    }

}
