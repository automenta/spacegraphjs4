import * as d from "three";
import { Matrix4 as j, Vector3 as U, Quaternion as L, Object3D as W } from "three";
const A = new U(), B = new L(), F = new U();
class D extends W {
  /**
   * Constructs a new CSS3D object.
   *
   * @param {DOMElement} [element] - The DOM element.
   */
  constructor(t = document.createElement("div")) {
    super(), this.isCSS3DObject = !0, this.element = t, this.element.style.position = "absolute", this.element.style.pointerEvents = "auto", this.element.style.userSelect = "none", this.element.setAttribute("draggable", !1), this.addEventListener("removed", function() {
      this.traverse(function(i) {
        i.element instanceof i.element.ownerDocument.defaultView.Element && i.element.parentNode !== null && i.element.remove();
      });
    });
  }
  copy(t, i) {
    return super.copy(t, i), this.element = t.element.cloneNode(!0), this;
  }
}
const y = new j(), N = new j();
class G {
  /**
   * Constructs a new CSS3D renderer.
   *
   * @param {CSS3DRenderer~Parameters} [parameters] - The parameters.
   */
  constructor(t = {}) {
    const i = this;
    let s, n, a, o;
    const c = {
      camera: { style: "" },
      objects: /* @__PURE__ */ new WeakMap()
    }, f = t.element !== void 0 ? t.element : document.createElement("div");
    f.style.overflow = "hidden", this.domElement = f;
    const p = document.createElement("div");
    p.style.transformOrigin = "0 0", p.style.pointerEvents = "none", f.appendChild(p);
    const u = document.createElement("div");
    u.style.transformStyle = "preserve-3d", p.appendChild(u), this.getSize = function() {
      return {
        width: s,
        height: n
      };
    }, this.render = function(l, r) {
      const v = r.projectionMatrix.elements[5] * o;
      r.view && r.view.enabled ? (p.style.transform = `translate( ${-r.view.offsetX * (s / r.view.width)}px, ${-r.view.offsetY * (n / r.view.height)}px )`, p.style.transform += `scale( ${r.view.fullWidth / r.view.width}, ${r.view.fullHeight / r.view.height} )`) : p.style.transform = "", l.matrixWorldAutoUpdate === !0 && l.updateMatrixWorld(), r.parent === null && r.matrixWorldAutoUpdate === !0 && r.updateMatrixWorld();
      let P, w;
      r.isOrthographicCamera && (P = -(r.right + r.left) / 2, w = (r.top + r.bottom) / 2);
      const E = r.view && r.view.enabled ? r.view.height / r.view.fullHeight : 1, S = r.isOrthographicCamera ? `scale( ${E} )scale(` + v + ")translate(" + h(P) + "px," + h(w) + "px)" + g(r.matrixWorldInverse) : `scale( ${E} )translateZ(` + v + "px)" + g(r.matrixWorldInverse), O = (r.isPerspectiveCamera ? "perspective(" + v + "px) " : "") + S + "translate(" + a + "px," + o + "px)";
      c.camera.style !== O && (u.style.transform = O, c.camera.style = O), b(l, l, r);
    }, this.setSize = function(l, r) {
      s = l, n = r, a = s / 2, o = n / 2, f.style.width = l + "px", f.style.height = r + "px", p.style.width = l + "px", p.style.height = r + "px", u.style.width = l + "px", u.style.height = r + "px";
    };
    function h(l) {
      return Math.abs(l) < 1e-10 ? 0 : l;
    }
    function g(l) {
      const r = l.elements;
      return "matrix3d(" + h(r[0]) + "," + h(-r[1]) + "," + h(r[2]) + "," + h(r[3]) + "," + h(r[4]) + "," + h(-r[5]) + "," + h(r[6]) + "," + h(r[7]) + "," + h(r[8]) + "," + h(-r[9]) + "," + h(r[10]) + "," + h(r[11]) + "," + h(r[12]) + "," + h(-r[13]) + "," + h(r[14]) + "," + h(r[15]) + ")";
    }
    function _(l) {
      const r = l.elements;
      return "translate(-50%,-50%)" + ("matrix3d(" + h(r[0]) + "," + h(r[1]) + "," + h(r[2]) + "," + h(r[3]) + "," + h(-r[4]) + "," + h(-r[5]) + "," + h(-r[6]) + "," + h(-r[7]) + "," + h(r[8]) + "," + h(r[9]) + "," + h(r[10]) + "," + h(r[11]) + "," + h(r[12]) + "," + h(r[13]) + "," + h(r[14]) + "," + h(r[15]) + ")");
    }
    function M(l) {
      l.isCSS3DObject && (l.element.style.display = "none");
      for (let r = 0, v = l.children.length; r < v; r++)
        M(l.children[r]);
    }
    function b(l, r, v, P) {
      if (l.visible === !1) {
        M(l);
        return;
      }
      if (l.isCSS3DObject) {
        const w = l.layers.test(v.layers) === !0, E = l.element;
        if (E.style.display = w === !0 ? "" : "none", w === !0) {
          l.onBeforeRender(i, r, v);
          let S;
          l.isCSS3DSprite ? (y.copy(v.matrixWorldInverse), y.transpose(), l.rotation2D !== 0 && y.multiply(N.makeRotationZ(l.rotation2D)), l.matrixWorld.decompose(A, B, F), y.setPosition(A), y.scale(F), y.elements[3] = 0, y.elements[7] = 0, y.elements[11] = 0, y.elements[15] = 1, S = _(y)) : S = _(l.matrixWorld);
          const k = c.objects.get(l);
          if (k === void 0 || k.style !== S) {
            E.style.transform = S;
            const O = { style: S };
            c.objects.set(l, O);
          }
          E.parentNode !== u && u.appendChild(E), l.onAfterRender(i, r, v);
        }
      }
      for (let w = 0, E = l.children.length; w < E; w++)
        b(l.children[w], r, v);
    }
  }
}
class q {
  constructor(t, i) {
    this.container = t, this.scene = new d.Scene(), this.camera = i, this.renderer = new d.WebGLRenderer({ antialias: !0, alpha: !0 }), this.cssRenderer = new G(), this.setup();
  }
  setup() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight), this.renderer.setPixelRatio(window.devicePixelRatio), this.container.appendChild(this.renderer.domElement), this.renderer.domElement.style.position = "absolute", this.renderer.domElement.style.top = 0, this.renderer.domElement.style.zIndex = 0, this.cssRenderer.setSize(this.container.clientWidth, this.container.clientHeight), this.container.appendChild(this.cssRenderer.domElement), this.cssRenderer.domElement.style.position = "absolute", this.cssRenderer.domElement.style.top = 0, this.cssRenderer.domElement.style.zIndex = 1, this.cssRenderer.domElement.style.pointerEvents = "none", window.addEventListener("resize", this.onWindowResize.bind(this));
  }
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight, this.camera.updateProjectionMatrix(), this.renderer.setSize(this.container.clientWidth, this.container.clientHeight), this.cssRenderer.setSize(this.container.clientWidth, this.container.clientHeight), this.render();
  }
  render() {
    this.renderer.render(this.scene, this.camera), this.cssRenderer.render(this.scene, this.camera);
  }
  getScene() {
    return this.scene;
  }
  setAnimationLoop(t) {
    this.renderer.setAnimationLoop(t);
  }
  destroy() {
    window.removeEventListener("resize", this.onWindowResize.bind(this)), this.renderer.setAnimationLoop(null), this.renderer.dispose(), this.renderer.domElement.parentElement === this.container && this.container.removeChild(this.renderer.domElement), this.cssRenderer.domElement.parentElement === this.container && this.container.removeChild(this.cssRenderer.domElement);
  }
}
class $ {
  constructor(t, i) {
    this.scene = t, this.eventDispatcher = i, this.elements = /* @__PURE__ */ new Map(), this.hoverFrame = this.createHoverFrame(), this.scene.add(this.hoverFrame);
  }
  createHoverFrame() {
    const t = new d.BoxGeometry(1, 1, 1), i = new d.EdgesGeometry(t), s = new d.LineBasicMaterial({ color: 65535, linewidth: 2 }), n = new d.LineSegments(i, s);
    return n.visible = !1, n;
  }
  createObject(t) {
    let i;
    switch (t.type) {
      case "html": {
        const s = document.createElement("div");
        s.innerHTML = t.htmlContent || "", s.style.pointerEvents = "auto", i = new D(s);
        const n = 0.01;
        i.scale.set(n, n, n), s.addEventListener("click", (a) => {
          a.stopPropagation(), this.eventDispatcher.dispatchEvent({ type: "element:click", id: t.id });
        });
        break;
      }
      case "sphere": {
        const s = new d.MeshBasicMaterial({ color: t.color || 16777215 }), n = new d.SphereGeometry(t.size || 1, 32, 32);
        i = new d.Mesh(n, s);
        break;
      }
      case "box":
      default: {
        const s = new d.MeshBasicMaterial({ color: t.color || 16777215 }), n = new d.BoxGeometry(t.size || 1, t.size || 1, t.size || 1);
        i = new d.Mesh(n, s);
        break;
      }
    }
    return i.position.set(t.position.x, t.position.y, t.position.z), i.userData.id = t.id, i.userData.type = t.type, i;
  }
  add(t) {
    if (this.elements.has(t.id)) {
      console.warn(`Element with ID ${t.id} already exists. Use update() instead.`);
      return;
    }
    const i = this.createObject(t);
    this.elements.set(t.id, i), this.scene.add(i);
  }
  remove(t) {
    const i = this.elements.get(t);
    i && (this.scene.remove(i), i.geometry && i.geometry.dispose(), i.material && i.material.dispose(), i.traverse((s) => {
      s.geometry && s.geometry.dispose(), s.material && s.material.dispose();
    }), this.elements.delete(t));
  }
  update(t, i) {
    const s = this.elements.get(t);
    if (!s) {
      console.warn(`Element with ID ${t} not found.`);
      return;
    }
    i.position && s.position.set(i.position.x, i.position.y, i.position.z), i.color && s.material && s.material.color.set(i.color), i.htmlContent && s instanceof D && (s.element.innerHTML = i.htmlContent);
  }
  setHovered(t, i) {
    const s = this.elements.get(t);
    if (!s) {
      this.hoverFrame.visible = !1;
      return;
    }
    if (i) {
      const n = new d.Box3().setFromObject(s), a = n.getSize(new d.Vector3()), o = n.getCenter(new d.Vector3());
      this.hoverFrame.scale.set(a.x, a.y, a.z).multiplyScalar(1.1), this.hoverFrame.position.copy(o), this.hoverFrame.visible = !0;
    } else
      this.hoverFrame.visible = !1;
  }
  destroy() {
    [...this.elements.keys()].forEach((t) => this.remove(t)), this.hoverFrame && (this.hoverFrame.geometry && this.hoverFrame.geometry.dispose(), this.hoverFrame.material && this.hoverFrame.material.dispose(), this.scene.remove(this.hoverFrame));
  }
}
var I = Object.freeze({
  Linear: Object.freeze({
    None: function(e) {
      return e;
    },
    In: function(e) {
      return e;
    },
    Out: function(e) {
      return e;
    },
    InOut: function(e) {
      return e;
    }
  }),
  Quadratic: Object.freeze({
    In: function(e) {
      return e * e;
    },
    Out: function(e) {
      return e * (2 - e);
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? 0.5 * e * e : -0.5 * (--e * (e - 2) - 1);
    }
  }),
  Cubic: Object.freeze({
    In: function(e) {
      return e * e * e;
    },
    Out: function(e) {
      return --e * e * e + 1;
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? 0.5 * e * e * e : 0.5 * ((e -= 2) * e * e + 2);
    }
  }),
  Quartic: Object.freeze({
    In: function(e) {
      return e * e * e * e;
    },
    Out: function(e) {
      return 1 - --e * e * e * e;
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? 0.5 * e * e * e * e : -0.5 * ((e -= 2) * e * e * e - 2);
    }
  }),
  Quintic: Object.freeze({
    In: function(e) {
      return e * e * e * e * e;
    },
    Out: function(e) {
      return --e * e * e * e * e + 1;
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? 0.5 * e * e * e * e * e : 0.5 * ((e -= 2) * e * e * e * e + 2);
    }
  }),
  Sinusoidal: Object.freeze({
    In: function(e) {
      return 1 - Math.sin((1 - e) * Math.PI / 2);
    },
    Out: function(e) {
      return Math.sin(e * Math.PI / 2);
    },
    InOut: function(e) {
      return 0.5 * (1 - Math.sin(Math.PI * (0.5 - e)));
    }
  }),
  Exponential: Object.freeze({
    In: function(e) {
      return e === 0 ? 0 : Math.pow(1024, e - 1);
    },
    Out: function(e) {
      return e === 1 ? 1 : 1 - Math.pow(2, -10 * e);
    },
    InOut: function(e) {
      return e === 0 ? 0 : e === 1 ? 1 : (e *= 2) < 1 ? 0.5 * Math.pow(1024, e - 1) : 0.5 * (-Math.pow(2, -10 * (e - 1)) + 2);
    }
  }),
  Circular: Object.freeze({
    In: function(e) {
      return 1 - Math.sqrt(1 - e * e);
    },
    Out: function(e) {
      return Math.sqrt(1 - --e * e);
    },
    InOut: function(e) {
      return (e *= 2) < 1 ? -0.5 * (Math.sqrt(1 - e * e) - 1) : 0.5 * (Math.sqrt(1 - (e -= 2) * e) + 1);
    }
  }),
  Elastic: Object.freeze({
    In: function(e) {
      return e === 0 ? 0 : e === 1 ? 1 : -Math.pow(2, 10 * (e - 1)) * Math.sin((e - 1.1) * 5 * Math.PI);
    },
    Out: function(e) {
      return e === 0 ? 0 : e === 1 ? 1 : Math.pow(2, -10 * e) * Math.sin((e - 0.1) * 5 * Math.PI) + 1;
    },
    InOut: function(e) {
      return e === 0 ? 0 : e === 1 ? 1 : (e *= 2, e < 1 ? -0.5 * Math.pow(2, 10 * (e - 1)) * Math.sin((e - 1.1) * 5 * Math.PI) : 0.5 * Math.pow(2, -10 * (e - 1)) * Math.sin((e - 1.1) * 5 * Math.PI) + 1);
    }
  }),
  Back: Object.freeze({
    In: function(e) {
      var t = 1.70158;
      return e === 1 ? 1 : e * e * ((t + 1) * e - t);
    },
    Out: function(e) {
      var t = 1.70158;
      return e === 0 ? 0 : --e * e * ((t + 1) * e + t) + 1;
    },
    InOut: function(e) {
      var t = 2.5949095;
      return (e *= 2) < 1 ? 0.5 * (e * e * ((t + 1) * e - t)) : 0.5 * ((e -= 2) * e * ((t + 1) * e + t) + 2);
    }
  }),
  Bounce: Object.freeze({
    In: function(e) {
      return 1 - I.Bounce.Out(1 - e);
    },
    Out: function(e) {
      return e < 1 / 2.75 ? 7.5625 * e * e : e < 2 / 2.75 ? 7.5625 * (e -= 1.5 / 2.75) * e + 0.75 : e < 2.5 / 2.75 ? 7.5625 * (e -= 2.25 / 2.75) * e + 0.9375 : 7.5625 * (e -= 2.625 / 2.75) * e + 0.984375;
    },
    InOut: function(e) {
      return e < 0.5 ? I.Bounce.In(e * 2) * 0.5 : I.Bounce.Out(e * 2 - 1) * 0.5 + 0.5;
    }
  }),
  generatePow: function(e) {
    return e === void 0 && (e = 4), e = e < Number.EPSILON ? Number.EPSILON : e, e = e > 1e4 ? 1e4 : e, {
      In: function(t) {
        return Math.pow(t, e);
      },
      Out: function(t) {
        return 1 - Math.pow(1 - t, e);
      },
      InOut: function(t) {
        return t < 0.5 ? Math.pow(t * 2, e) / 2 : (1 - Math.pow(2 - t * 2, e)) / 2 + 0.5;
      }
    };
  }
}), x = function() {
  return performance.now();
}, H = (
  /** @class */
  (function() {
    function e() {
      for (var t = [], i = 0; i < arguments.length; i++)
        t[i] = arguments[i];
      this._tweens = {}, this._tweensAddedDuringUpdate = {}, this.add.apply(this, t);
    }
    return e.prototype.getAll = function() {
      var t = this;
      return Object.keys(this._tweens).map(function(i) {
        return t._tweens[i];
      });
    }, e.prototype.removeAll = function() {
      this._tweens = {};
    }, e.prototype.add = function() {
      for (var t, i = [], s = 0; s < arguments.length; s++)
        i[s] = arguments[s];
      for (var n = 0, a = i; n < a.length; n++) {
        var o = a[n];
        (t = o._group) === null || t === void 0 || t.remove(o), o._group = this, this._tweens[o.getId()] = o, this._tweensAddedDuringUpdate[o.getId()] = o;
      }
    }, e.prototype.remove = function() {
      for (var t = [], i = 0; i < arguments.length; i++)
        t[i] = arguments[i];
      for (var s = 0, n = t; s < n.length; s++) {
        var a = n[s];
        a._group = void 0, delete this._tweens[a.getId()], delete this._tweensAddedDuringUpdate[a.getId()];
      }
    }, e.prototype.allStopped = function() {
      return this.getAll().every(function(t) {
        return !t.isPlaying();
      });
    }, e.prototype.update = function(t, i) {
      t === void 0 && (t = x()), i === void 0 && (i = !0);
      var s = Object.keys(this._tweens);
      if (s.length !== 0)
        for (; s.length > 0; ) {
          this._tweensAddedDuringUpdate = {};
          for (var n = 0; n < s.length; n++) {
            var a = this._tweens[s[n]], o = !i;
            a && a.update(t, o) === !1 && !i && this.remove(a);
          }
          s = Object.keys(this._tweensAddedDuringUpdate);
        }
    }, e;
  })()
), C = {
  Linear: function(e, t) {
    var i = e.length - 1, s = i * t, n = Math.floor(s), a = C.Utils.Linear;
    return t < 0 ? a(e[0], e[1], s) : t > 1 ? a(e[i], e[i - 1], i - s) : a(e[n], e[n + 1 > i ? i : n + 1], s - n);
  },
  Bezier: function(e, t) {
    for (var i = 0, s = e.length - 1, n = Math.pow, a = C.Utils.Bernstein, o = 0; o <= s; o++)
      i += n(1 - t, s - o) * n(t, o) * e[o] * a(s, o);
    return i;
  },
  CatmullRom: function(e, t) {
    var i = e.length - 1, s = i * t, n = Math.floor(s), a = C.Utils.CatmullRom;
    return e[0] === e[i] ? (t < 0 && (n = Math.floor(s = i * (1 + t))), a(e[(n - 1 + i) % i], e[n], e[(n + 1) % i], e[(n + 2) % i], s - n)) : t < 0 ? e[0] - (a(e[0], e[0], e[1], e[1], -s) - e[0]) : t > 1 ? e[i] - (a(e[i], e[i], e[i - 1], e[i - 1], s - i) - e[i]) : a(e[n ? n - 1 : 0], e[n], e[i < n + 1 ? i : n + 1], e[i < n + 2 ? i : n + 2], s - n);
  },
  Utils: {
    Linear: function(e, t, i) {
      return (t - e) * i + e;
    },
    Bernstein: function(e, t) {
      var i = C.Utils.Factorial;
      return i(e) / i(t) / i(e - t);
    },
    Factorial: /* @__PURE__ */ (function() {
      var e = [1];
      return function(t) {
        var i = 1;
        if (e[t])
          return e[t];
        for (var s = t; s > 1; s--)
          i *= s;
        return e[t] = i, i;
      };
    })(),
    CatmullRom: function(e, t, i, s, n) {
      var a = (i - e) * 0.5, o = (s - t) * 0.5, c = n * n, f = n * c;
      return (2 * t - 2 * i + a + o) * f + (-3 * t + 3 * i - 2 * a - o) * c + a * n + t;
    }
  }
}, z = (
  /** @class */
  (function() {
    function e() {
    }
    return e.nextId = function() {
      return e._nextId++;
    }, e._nextId = 0, e;
  })()
), T = new H(), V = (
  /** @class */
  (function() {
    function e(t, i) {
      this._isPaused = !1, this._pauseStart = 0, this._valuesStart = {}, this._valuesEnd = {}, this._valuesStartRepeat = {}, this._duration = 1e3, this._isDynamic = !1, this._initialRepeat = 0, this._repeat = 0, this._yoyo = !1, this._isPlaying = !1, this._reversed = !1, this._delayTime = 0, this._startTime = 0, this._easingFunction = I.Linear.None, this._interpolationFunction = C.Linear, this._chainedTweens = [], this._onStartCallbackFired = !1, this._onEveryStartCallbackFired = !1, this._id = z.nextId(), this._isChainStopped = !1, this._propertiesAreSetUp = !1, this._goToEnd = !1, this._object = t, typeof i == "object" ? (this._group = i, i.add(this)) : i === !0 && (this._group = T, T.add(this));
    }
    return e.prototype.getId = function() {
      return this._id;
    }, e.prototype.isPlaying = function() {
      return this._isPlaying;
    }, e.prototype.isPaused = function() {
      return this._isPaused;
    }, e.prototype.getDuration = function() {
      return this._duration;
    }, e.prototype.to = function(t, i) {
      if (i === void 0 && (i = 1e3), this._isPlaying)
        throw new Error("Can not call Tween.to() while Tween is already started or paused. Stop the Tween first.");
      return this._valuesEnd = t, this._propertiesAreSetUp = !1, this._duration = i < 0 ? 0 : i, this;
    }, e.prototype.duration = function(t) {
      return t === void 0 && (t = 1e3), this._duration = t < 0 ? 0 : t, this;
    }, e.prototype.dynamic = function(t) {
      return t === void 0 && (t = !1), this._isDynamic = t, this;
    }, e.prototype.start = function(t, i) {
      if (t === void 0 && (t = x()), i === void 0 && (i = !1), this._isPlaying)
        return this;
      if (this._repeat = this._initialRepeat, this._reversed) {
        this._reversed = !1;
        for (var s in this._valuesStartRepeat)
          this._swapEndStartRepeatValues(s), this._valuesStart[s] = this._valuesStartRepeat[s];
      }
      if (this._isPlaying = !0, this._isPaused = !1, this._onStartCallbackFired = !1, this._onEveryStartCallbackFired = !1, this._isChainStopped = !1, this._startTime = t, this._startTime += this._delayTime, !this._propertiesAreSetUp || i) {
        if (this._propertiesAreSetUp = !0, !this._isDynamic) {
          var n = {};
          for (var a in this._valuesEnd)
            n[a] = this._valuesEnd[a];
          this._valuesEnd = n;
        }
        this._setupProperties(this._object, this._valuesStart, this._valuesEnd, this._valuesStartRepeat, i);
      }
      return this;
    }, e.prototype.startFromCurrentValues = function(t) {
      return this.start(t, !0);
    }, e.prototype._setupProperties = function(t, i, s, n, a) {
      for (var o in s) {
        var c = t[o], f = Array.isArray(c), p = f ? "array" : typeof c, u = !f && Array.isArray(s[o]);
        if (!(p === "undefined" || p === "function")) {
          if (u) {
            var h = s[o];
            if (h.length === 0)
              continue;
            for (var g = [c], _ = 0, M = h.length; _ < M; _ += 1) {
              var b = this._handleRelativeValue(c, h[_]);
              if (isNaN(b)) {
                u = !1, console.warn("Found invalid interpolation list. Skipping.");
                break;
              }
              g.push(b);
            }
            u && (s[o] = g);
          }
          if ((p === "object" || f) && c && !u) {
            i[o] = f ? [] : {};
            var l = c;
            for (var r in l)
              i[o][r] = l[r];
            n[o] = f ? [] : {};
            var h = s[o];
            if (!this._isDynamic) {
              var v = {};
              for (var r in h)
                v[r] = h[r];
              s[o] = h = v;
            }
            this._setupProperties(l, i[o], h, n[o], a);
          } else
            (typeof i[o] > "u" || a) && (i[o] = c), f || (i[o] *= 1), u ? n[o] = s[o].slice().reverse() : n[o] = i[o] || 0;
        }
      }
    }, e.prototype.stop = function() {
      return this._isChainStopped || (this._isChainStopped = !0, this.stopChainedTweens()), this._isPlaying ? (this._isPlaying = !1, this._isPaused = !1, this._onStopCallback && this._onStopCallback(this._object), this) : this;
    }, e.prototype.end = function() {
      return this._goToEnd = !0, this.update(this._startTime + this._duration), this;
    }, e.prototype.pause = function(t) {
      return t === void 0 && (t = x()), this._isPaused || !this._isPlaying ? this : (this._isPaused = !0, this._pauseStart = t, this);
    }, e.prototype.resume = function(t) {
      return t === void 0 && (t = x()), !this._isPaused || !this._isPlaying ? this : (this._isPaused = !1, this._startTime += t - this._pauseStart, this._pauseStart = 0, this);
    }, e.prototype.stopChainedTweens = function() {
      for (var t = 0, i = this._chainedTweens.length; t < i; t++)
        this._chainedTweens[t].stop();
      return this;
    }, e.prototype.group = function(t) {
      return t ? (t.add(this), this) : (console.warn("tween.group() without args has been removed, use group.add(tween) instead."), this);
    }, e.prototype.remove = function() {
      var t;
      return (t = this._group) === null || t === void 0 || t.remove(this), this;
    }, e.prototype.delay = function(t) {
      return t === void 0 && (t = 0), this._delayTime = t, this;
    }, e.prototype.repeat = function(t) {
      return t === void 0 && (t = 0), this._initialRepeat = t, this._repeat = t, this;
    }, e.prototype.repeatDelay = function(t) {
      return this._repeatDelayTime = t, this;
    }, e.prototype.yoyo = function(t) {
      return t === void 0 && (t = !1), this._yoyo = t, this;
    }, e.prototype.easing = function(t) {
      return t === void 0 && (t = I.Linear.None), this._easingFunction = t, this;
    }, e.prototype.interpolation = function(t) {
      return t === void 0 && (t = C.Linear), this._interpolationFunction = t, this;
    }, e.prototype.chain = function() {
      for (var t = [], i = 0; i < arguments.length; i++)
        t[i] = arguments[i];
      return this._chainedTweens = t, this;
    }, e.prototype.onStart = function(t) {
      return this._onStartCallback = t, this;
    }, e.prototype.onEveryStart = function(t) {
      return this._onEveryStartCallback = t, this;
    }, e.prototype.onUpdate = function(t) {
      return this._onUpdateCallback = t, this;
    }, e.prototype.onRepeat = function(t) {
      return this._onRepeatCallback = t, this;
    }, e.prototype.onComplete = function(t) {
      return this._onCompleteCallback = t, this;
    }, e.prototype.onStop = function(t) {
      return this._onStopCallback = t, this;
    }, e.prototype.update = function(t, i) {
      var s = this, n;
      if (t === void 0 && (t = x()), i === void 0 && (i = e.autoStartOnUpdate), this._isPaused)
        return !0;
      var a;
      if (!this._goToEnd && !this._isPlaying)
        if (i)
          this.start(t, !0);
        else
          return !1;
      if (this._goToEnd = !1, t < this._startTime)
        return !0;
      this._onStartCallbackFired === !1 && (this._onStartCallback && this._onStartCallback(this._object), this._onStartCallbackFired = !0), this._onEveryStartCallbackFired === !1 && (this._onEveryStartCallback && this._onEveryStartCallback(this._object), this._onEveryStartCallbackFired = !0);
      var o = t - this._startTime, c = this._duration + ((n = this._repeatDelayTime) !== null && n !== void 0 ? n : this._delayTime), f = this._duration + this._repeat * c, p = function() {
        if (s._duration === 0 || o > f)
          return 1;
        var b = Math.trunc(o / c), l = o - b * c, r = Math.min(l / s._duration, 1);
        return r === 0 && o === s._duration ? 1 : r;
      }, u = p(), h = this._easingFunction(u);
      if (this._updateProperties(this._object, this._valuesStart, this._valuesEnd, h), this._onUpdateCallback && this._onUpdateCallback(this._object, u), this._duration === 0 || o >= this._duration)
        if (this._repeat > 0) {
          var g = Math.min(Math.trunc((o - this._duration) / c) + 1, this._repeat);
          isFinite(this._repeat) && (this._repeat -= g);
          for (a in this._valuesStartRepeat)
            !this._yoyo && typeof this._valuesEnd[a] == "string" && (this._valuesStartRepeat[a] = // eslint-disable-next-line
            // @ts-ignore FIXME?
            this._valuesStartRepeat[a] + parseFloat(this._valuesEnd[a])), this._yoyo && this._swapEndStartRepeatValues(a), this._valuesStart[a] = this._valuesStartRepeat[a];
          return this._yoyo && (this._reversed = !this._reversed), this._startTime += c * g, this._onRepeatCallback && this._onRepeatCallback(this._object), this._onEveryStartCallbackFired = !1, !0;
        } else {
          this._onCompleteCallback && this._onCompleteCallback(this._object);
          for (var _ = 0, M = this._chainedTweens.length; _ < M; _++)
            this._chainedTweens[_].start(this._startTime + this._duration, !1);
          return this._isPlaying = !1, !1;
        }
      return !0;
    }, e.prototype._updateProperties = function(t, i, s, n) {
      for (var a in s)
        if (i[a] !== void 0) {
          var o = i[a] || 0, c = s[a], f = Array.isArray(t[a]), p = Array.isArray(c), u = !f && p;
          u ? t[a] = this._interpolationFunction(c, n) : typeof c == "object" && c ? this._updateProperties(t[a], o, c, n) : (c = this._handleRelativeValue(o, c), typeof c == "number" && (t[a] = o + (c - o) * n));
        }
    }, e.prototype._handleRelativeValue = function(t, i) {
      return typeof i != "string" ? i : i.charAt(0) === "+" || i.charAt(0) === "-" ? t + parseFloat(i) : parseFloat(i);
    }, e.prototype._swapEndStartRepeatValues = function(t) {
      var i = this._valuesStartRepeat[t], s = this._valuesEnd[t];
      typeof s == "string" ? this._valuesStartRepeat[t] = this._valuesStartRepeat[t] + parseFloat(s) : this._valuesStartRepeat[t] = this._valuesEnd[t], this._valuesEnd[t] = i;
    }, e.autoStartOnUpdate = !1, e;
  })()
), Q = "25.0.0", X = z.nextId, m = T, Y = m.getAll.bind(m), Z = m.removeAll.bind(m), J = m.add.bind(m), K = m.remove.bind(m), ee = m.update.bind(m), R = {
  Easing: I,
  Group: H,
  Interpolation: C,
  now: x,
  Sequence: z,
  nextId: X,
  Tween: V,
  VERSION: Q,
  /**
   * @deprecated The global TWEEN Group will be removed in a following major
   * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
   * group.
   *
   * Old code:
   *
   * ```js
   * import * as TWEEN from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new TWEEN.Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   TWEEN.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   *
   * New code:
   *
   * ```js
   * import {Tween, Group} from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * const group = new Group()
   * group.add(tween)
   * group.add(tween2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   group.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   */
  getAll: Y,
  /**
   * @deprecated The global TWEEN Group will be removed in a following major
   * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
   * group.
   *
   * Old code:
   *
   * ```js
   * import * as TWEEN from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new TWEEN.Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   TWEEN.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   *
   * New code:
   *
   * ```js
   * import {Tween, Group} from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * const group = new Group()
   * group.add(tween)
   * group.add(tween2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   group.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   */
  removeAll: Z,
  /**
   * @deprecated The global TWEEN Group will be removed in a following major
   * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
   * group.
   *
   * Old code:
   *
   * ```js
   * import * as TWEEN from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new TWEEN.Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   TWEEN.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   *
   * New code:
   *
   * ```js
   * import {Tween, Group} from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * const group = new Group()
   * group.add(tween)
   * group.add(tween2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   group.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   */
  add: J,
  /**
   * @deprecated The global TWEEN Group will be removed in a following major
   * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
   * group.
   *
   * Old code:
   *
   * ```js
   * import * as TWEEN from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new TWEEN.Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   TWEEN.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   *
   * New code:
   *
   * ```js
   * import {Tween, Group} from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * const group = new Group()
   * group.add(tween)
   * group.add(tween2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   group.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   */
  remove: K,
  /**
   * @deprecated The global TWEEN Group will be removed in a following major
   * release. To migrate, create a `new Group()` instead of using `TWEEN` as a
   * group.
   *
   * Old code:
   *
   * ```js
   * import * as TWEEN from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new TWEEN.Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   TWEEN.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   *
   * New code:
   *
   * ```js
   * import {Tween, Group} from '@tweenjs/tween.js'
   *
   * //...
   *
   * const tween = new Tween(obj)
   * const tween2 = new TWEEN.Tween(obj2)
   *
   * //...
   *
   * const group = new Group()
   * group.add(tween)
   * group.add(tween2)
   *
   * //...
   *
   * requestAnimationFrame(function loop(time) {
   *   group.update(time)
   *   requestAnimationFrame(loop)
   * })
   * ```
   */
  update: ee
};
class te {
  constructor(t) {
    this.camera = t, this.history = [], this.isAnimating = !1, this.currentTarget = new d.Vector3(0, 0, 0);
  }
  // Fly the camera to a target element
  flyTo(t) {
    if (this.isAnimating) return;
    this.history.push({
      position: this.camera.position.clone(),
      target: this.currentTarget.clone()
    });
    const i = t, s = new d.Box3().setFromObject(i), n = s.getCenter(new d.Vector3()), a = s.getSize(new d.Vector3()), o = 1.2, c = this.camera.fov * (Math.PI / 180), f = this.camera.aspect, p = a.y / 2 / Math.tan(c / 2), u = 2 * Math.atan(Math.tan(c / 2) * f), h = a.x / 2 / Math.tan(u / 2), g = o * Math.max(p, h), _ = new d.Vector3().subVectors(this.camera.position, n).normalize(), M = new d.Vector3().addVectors(n, _.multiplyScalar(g));
    this.animateCamera(M, n);
  }
  // Go back to the previous camera state
  goBack() {
    if (this.isAnimating || this.history.length === 0) return;
    const t = this.history.pop();
    this.animateCamera(t.position, t.target);
  }
  // Animate camera to a new position and target
  animateCamera(t, i) {
    this.isAnimating = !0;
    const s = this.camera.position.clone(), n = this.currentTarget.clone();
    new R.Tween(s).to(t, 500).easing(R.Easing.Quadratic.InOut).onUpdate(() => {
      this.camera.position.copy(s);
    }).start(), new R.Tween(n).to(i, 500).easing(R.Easing.Quadratic.InOut).onUpdate(() => {
      this.camera.lookAt(n), this.currentTarget.copy(n);
    }).onComplete(() => {
      this.isAnimating = !1, this.camera.lookAt(i), this.currentTarget.copy(i);
    }).start();
  }
  // Update needs to be called in the main animation loop
  update(t) {
    R.update(t);
  }
}
class ie {
  constructor(t, i, s, n, a) {
    this.camera = t, this.canvas = i, this.sceneManager = s, this.cameraManager = n, this.eventDispatcher = a, this.raycaster = new d.Raycaster(), this.mouse = new d.Vector2(), this.hoveredElementId = null, this.focusedElementId = null, this.onMouseMove = this.onMouseMove.bind(this), this.onCanvasClick = this.onCanvasClick.bind(this), this.canvas.addEventListener("mousemove", this.onMouseMove, !1), this.canvas.addEventListener("click", this.onCanvasClick, !1);
  }
  onMouseMove(t) {
    this.mouse.x = t.clientX / this.canvas.clientWidth * 2 - 1, this.mouse.y = -(t.clientY / this.canvas.clientHeight) * 2 + 1, this.raycaster.setFromCamera(this.mouse, this.camera);
    const i = this.raycaster.intersectObjects([...this.sceneManager.elements.values()]);
    if (i.length > 0) {
      const s = i[0].object;
      if (s.userData.type === "html") {
        this.setHovered(null);
        return;
      }
      const n = s.userData.id;
      this.hoveredElementId !== n && this.setHovered(n);
    } else
      this.hoveredElementId !== null && this.setHovered(null);
  }
  onCanvasClick(t) {
    if (this.hoveredElementId) {
      const i = this.sceneManager.elements.get(this.hoveredElementId);
      i && i.userData.type !== "html" && (this.eventDispatcher.dispatchEvent({ type: "element:click", id: this.hoveredElementId }), this.hoveredElementId === this.focusedElementId ? (this.cameraManager.goBack(), this.focusedElementId = null) : (this.cameraManager.flyTo(i), this.focusedElementId = this.hoveredElementId));
    }
  }
  setHovered(t, i) {
    this.hoveredElementId && this.sceneManager.setHovered(this.hoveredElementId, !1), this.hoveredElementId = t, this.hoveredElementId && this.sceneManager.setHovered(this.hoveredElementId, !0);
  }
  destroy() {
    this.canvas.removeEventListener("mousemove", this.onMouseMove), this.canvas.removeEventListener("click", this.onCanvasClick);
  }
}
class ne extends d.EventDispatcher {
  constructor(t, { elements: i = [] } = {}) {
    super();
    const s = new d.PerspectiveCamera(75, t.clientWidth / t.clientHeight, 0.1, 1e3);
    s.position.z = 5, this.cameraManager = new te(s), this.renderer = new q(t, s), this.sceneManager = new $(this.renderer.getScene(), this), this.interactionManager = new ie(s, this.renderer.renderer.domElement, this.sceneManager, this.cameraManager, this), i.forEach((n) => {
      this.sceneManager.add(n);
    }), this.start();
  }
  add(t) {
    this.sceneManager.add(t);
  }
  remove(t) {
    this.sceneManager.remove(t);
  }
  update(t, i) {
    this.sceneManager.update(t, i);
  }
  goBack() {
    this.cameraManager.goBack();
  }
  // A simple animation loop
  start() {
    this.renderer.setAnimationLoop((t) => {
      this.cameraManager.update(t), this.renderer.render();
    });
  }
  destroy() {
    this.renderer.setAnimationLoop(null), this.interactionManager.destroy(), this.sceneManager.destroy(), this.renderer.destroy(), this._listeners && Object.keys(this._listeners).forEach((t) => {
      delete this._listeners[t];
    });
  }
  // Alias for addEventListener
  on(t, i) {
    this.addEventListener(t, i);
  }
}
export {
  ne as default
};
