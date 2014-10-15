RouteController.prototype.subscribe = function () {
  var self = this;

  var waitApi = (function () {
    return {
      wait: function () {
        self._waitList.push(SubsManager);
        added = true;
      }
    };
  })();

  var handle = SubsManager.subscribe(this, arguments);
  return _.extend(handle, waitApi);
};

RouteController.prototype.mapSubscriptions = function (cb) {
  var self = this;

  var waitApi = (function () {
    return {
      wait: function () {
        self._waitList.push(SubsManager);
        added = true;
      }
    };
  })();

  var handle = SubsManager.mapSubscriptions(cb);
  return _.extend(handle, waitApi);
};
