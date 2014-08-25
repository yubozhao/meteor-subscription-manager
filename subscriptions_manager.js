SubscriptionsManager = function (cacheLimit) {
  var self = this;
  self._cacheList = [];  //FIFO
  self._cacheLimit = cacheLimit || 10; //Do we really care about this?
  self._cacheMap = {};
  self._currentList = [];
  self.ready = false;
  self.dep = new Deps.Dependency;
  self.computation = Deps.autorun(function () {
    var ready = true;

    _.each(self._currentList, function (sub) {
      sub.ready = Meteor.subscribe.apply(Meteor, sub.args).ready();

      if (self._cacheMap[sub.hash].wait)
        ready = ready && sub.ready;
    });

    self._updateCacheList();
    _.each(self._cacheList, function (sub) {
      sub.ready = Meteor.subscribe.apply(Meteor, sub.args).ready();
    });

    if (ready) {
      self.ready = true;
      self.dep.changed();
    }
  });
};

SubscriptionsManager.prototype.subscribe = function () {
  var self = this;
  var args = arguments;
  if (Meteor.isClient) {
    self._addSub(args);
    self._updateCurrentList([]);

    return {
      ready: function () {
        self.dep.depend();
        return self.ready;
      },
      wait: function () {
        self._waitSubscription(args);
      }
    };
  }
};

SubscriptionsManager.prototype._addSub = function (args) {
  var self = this;
  var hash = JSON.stringify(args);

  if(!self._cacheMap[hash]) {
    var sub = {
      args: args,
      hash: hash,
      dep: new Deps.Dependency
    };
    self._cacheMap[hash] = sub;
    self._cacheList.push(sub);

    if (Deps.currentComputation) {
      Deps.afterFlush(function () {
        self.computation.invalidate();
      })
    } else {
      self.computation.invalidate();
    }
  }

  /*
  //make sure it is the most recent item(last one enter) on cachelist
  var sub = self._cacheMap[hash];
  sub.updated = Date.now();

  var index = self._cacheList.indexOf(sub);
  self._cacheList.splice(index, 1);
  self._cacheList.push(sub);
  */
};

SubscriptionsManager.prototype._waitSubscription = function (args) {
  var self = this;
  var hash = JSON.stringify(args);
  if (self._cacheMap[hash]) {
    _.extend(self._cacheMap[hash], {wait: true});
  }
};

SubscriptionsManager.prototype.mapSubscriptions = function (cb) {
  var self = this;

  var currentList = [];

  var originSubscribe = self.subscribe;
  self.subscribe = function () {
    var args = arguments;
    var hash = JSON.stringify(args);
    var sub = {
      args: args,
      hash: hash
    };

    if(!self._cacheMap[hash])
      self._cacheMap[hash] = sub;

    currentList.push(sub);
    return {
      ready: function () {
        self.dep.depend();
        return self.ready;
      },
      wait: function () {
        self._waitSubscription(args);
      }
    }
  };

  cb.call(self);

  //update lists
  if (_.isEmpty(self._currentList)) {
    self._currentList = currentList;
  } else {
    self._currentList = self._currentList;
    self._cacheList = self._cacheList.concat(self._currentList);
    self._currentList = currentList;
  }

  //return back to the normal subscribe function
  self.subscribe = originSubscribe;

  if (Deps.currentComputation) {
    Deps.afterFlush(function () {
      self.computation.invalidate();
    })
  } else {
    self.computation.invalidate();
  }

  return {
    ready: function () {
      self.dep.depend();
      return self.ready;
    }
  };
};

SubscriptionsManager.prototype._updateCacheList = function () {
  var self = this;

  var hashes = _.pluck(self._cacheList, 'hash');
  var list = [];

  //finding unqiue hashs here.
  hashes = _.uniq(hashes);
  _.each(hashes, function (hash) {
    if (self._cacheMap[hash]) {
      list.push(self._cacheMap[hash]);
    }
  });

  self._cacheList = list;

  if (self._cacheLimit === false)
    return;

  var overLimit = self._cacheList.length - self._cacheLimit;

  if (overLimit > 0) {
    var removed = self._cacheList.splice(0, overLimit);
    _.each(removed, function (sub) {
      delete self._cacheMap[sub.hash];
    });
  }
};

SubscriptionsManager.prototype._updateCurrentList = function (currentList) {
  var self = this;
  if (_.isEmpty(self._currentList)) {
    self._currentList = currentList;
    return;
  }
  if (_.isEmpty(currentList)) {
    self._cacheList = self._cacheList.concat(self._currentList);
    self._currentList = [];
    self._updateCacheList();
  } else {
    self._currentList = self._currentList;
    self._cacheList = self._cacheList.concat(self._currentList);
    self._currentList = currentList;
    self._updateCacheList();
  }
};

SubsManager = new SubscriptionsManager;
