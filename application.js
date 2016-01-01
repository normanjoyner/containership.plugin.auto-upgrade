var _ = require("lodash");
var scheduler = require([__dirname, "lib", "scheduler"].join("/"));
var ContainershipPlugin = require("containership.plugin");

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
            max_splay: (5 * 60 * 1000)
        }

        cloud.get_schedule(function(err, schedule){
            if(err)
                schedule = self.config;

            var options = _.defaults(schedule, defaults);

            var attributes = core.cluster.legiond.get_attributes();

            if(_.has(attributes, "metadata") && _.has(attributes.metadata, "containership"))
                options.version = attributes.metadata.containership.version;

            scheduler.create_job(options.schedule, function(){
                upgrade.attempt(options);
            });
        });
    },

    reload: function(){
        scheduler.cancel_job();
    }
});
