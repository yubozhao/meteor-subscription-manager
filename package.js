Package.describe({
  "summary": "Subscription Manager for Meteor",
  "version": "0.1.1",
  "git": "https://github.com/yubozhao/meteor-subscription-manager",
  "name": "bozhao:subscription-manager"
});

Package.on_use(function(api) {
  api.versionsFrom('METEOR@0.9.0');

  api.use('deps');
  api.use('underscore');

  api.add_files('subscriptions_manager.js', ['client']);

  api.export(['SubsManager'], ['client']);
});
