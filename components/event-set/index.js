var styleParser = {
  parseKebabCase: function (value) {
    var kebabCaseProps = {};
    var camelCaseProps = AFRAME.utils.styleParser.parse(value);
    
    // Convert camelCase keys from styleParser to kebab-case.
    for (var key in camelCaseProps) {
      var hyphenatedKey = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      kebabCaseProps[hyphenatedKey] = camelCaseProps[key];
    }
    return kebabCaseProps;
  },
};

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('event-set', {
  schema: {
    default: '',
    parse: function (value) {
      return styleParser.parseKebabCase(value);
    }
  },

  multiple: true,

  init: function () {
    this.eventHandler = null;
    this.eventName = null;
  },

  update: function (oldData) {
    this.removeEventListener();
    this.updateEventListener();
    this.addEventListener();
  },

  pause: function () {
    this.removeEventListener();
  },

  play: function () {
    this.addEventListener();
  },

  /**
   * Update source-of-truth event listener registry.
   * Does not actually attach event listeners yet.
   */
  updateEventListener: function () {
    var data = this.data;
    var el = this.el;
    var event;
    var target;
    var targetEl;

    // Set event listener using `_event`.
    event = data._event || this.id;
    target = data._target;

    // Decide the target to `setAttribute` on.
    targetEl = target ? el.sceneEl.querySelector(target) : el;

    this.eventName = event;

    const handler = () => {
      var propName;
      // Set attributes.
      for (propName in data) {
        if (propName === '_event' || propName === '_target') { continue; }
        AFRAME.utils.entity.setComponentProperty.call(this, targetEl, propName,
                                                      data[propName]);
      }
    };

    if (!isNaN(data._delay)) {
      // Delay.
      this.eventHandler = () => { setTimeout(handler, parseFloat(data._delay)); };
    } else {
      this.eventHandler = handler;
    }
  },

  addEventListener: function () {
    this.el.addEventListener(this.eventName, this.eventHandler);
  },

  removeEventListener: function () {
    this.el.removeEventListener(this.eventName, this.eventHandler);
  }
});
