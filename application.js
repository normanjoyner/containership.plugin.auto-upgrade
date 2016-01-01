var _ = require("lodash");
var scheduler = require([__dirname, "lib", "scheduler"].join("/"));
var ContainershipPlugin = require("containership.plugin");
var async = require("async");

module.exports = new ContainershipPlugin({
    type: "core",
    name: "auto-upgrade",

    initialize: function(core){
        var self = this;

        core.logger.register(this.name);

        var cloud = require([__dirname, "lib", "cloud"].join("/"))(core);
        var upgrade = require([__dirname, "lib", "upgrade"].join("/"))(core);

        var defaults = {
            schedule: {
                hour: 0,
                minute: 0,
                dayOfWeek: 0
            },
            max_splay: function(){
                return (core.cluster.legiond.get_peers().length + 1) * (60 * 1000);
            }
        }

        var set_schedule = function(fn){
            cloud.get_schedule(function(err, schedule){
                if(err)
                    schedule = self.get_config();

                if(_.isEmpty(schedule))
                    return fn(new Error("No schedule detected!"));

                var options = _.defaults(schedule, defaults);

                var attributes = core.cluster.legiond.get_attributes();

                if(_.has(attributes, "metadata") && _.has(attributes.metadata, "containership"))
                    options.version = attributes.metadata.containership.version;

                scheduler.create_job(options.schedule, function(){
                    upgrade.attempt(options);
                });
            });
        }

        set_schedule(function(err){
            if(err){
                async.forever(function(fn){
                    setTimeout(function(){
                        set_schedule(function(err){
                            return fn();
                        });
                    }, (60 * 1000));
                }, function(err){});
            }
        });
    },

    reload: function(){
        scheduler.cancel_job();
    }
});
