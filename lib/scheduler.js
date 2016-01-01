var schedule = require("node-schedule");

module.exports = {

    job: null,

    create_job: function(upgrade_schedule, fn){
        this.job = schedule.scheduleJob(upgrade_schedule, fn);
    },

    cancel_job: function(){
        this.job.cancel();
    }

}
