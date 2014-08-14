Package.describe({
  "summary": "Subscription Manager for Meteor"
});

Package.on_use(function(api) {
  api.use('deps');
  api.use('underscore');

  api.add_files('subscriptions_manager.js', ['client']);

  api.export(['SubsManager'], ['client']);
});
