/* @ds-bundle: {"format":4,"namespace":"MGHPMDesignSystem_f42280","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"ProgressBar","sourcePath":"components/data/ProgressBar.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"RadioCard","sourcePath":"components/forms/RadioCard.jsx"},{"name":"SelectField","sourcePath":"components/forms/SelectField.jsx"},{"name":"TextField","sourcePath":"components/forms/TextField.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"FilterTabs","sourcePath":"components/navigation/FilterTabs.jsx"},{"name":"Sidebar","sourcePath":"components/navigation/Sidebar.jsx"},{"name":"Stepper","sourcePath":"components/navigation/Stepper.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"bbc73b6ab0b8","components/core/Badge.jsx":"91df2ca6ad51","components/core/Button.jsx":"57ff0378d8c7","components/core/Card.jsx":"43f270eebba0","components/core/Icon.jsx":"769d0f8982c4","components/data/DataTable.jsx":"eb8c3dfb4a29","components/data/ProgressBar.jsx":"fb5bc12ef653","components/data/StatCard.jsx":"cb484e9e4edc","components/forms/Checkbox.jsx":"48dbbcb7f593","components/forms/RadioCard.jsx":"f2ce8eb726a3","components/forms/SelectField.jsx":"e294e0106fca","components/forms/TextField.jsx":"9611fe680df4","components/navigation/Breadcrumbs.jsx":"2bdc96a00567","components/navigation/FilterTabs.jsx":"4d66e13559f4","components/navigation/Sidebar.jsx":"6981b52bf3ce","components/navigation/Stepper.jsx":"cf62b9109e26","components/navigation/TopBar.jsx":"64a66dbd6d8d","ui_kits/mghpm-enterprise/App.jsx":"56f98b4ff91f","ui_kits/mghpm-enterprise/Leasing.jsx":"42531767dead","ui_kits/mghpm-enterprise/NewLease.jsx":"f64145c0b0f3","ui_kits/mghpm-enterprise/OwnerPortal.jsx":"27cf4623b15d","ui_kits/mghpm-enterprise/Reports.jsx":"45687507d09c","ui_kits/mghpm-enterprise/Shared.jsx":"b51476252c0b","ui_kits/mghpm-enterprise/WorkOrders.jsx":"703cb568ef4c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MGHPMDesignSystem_f42280 = window.MGHPMDesignSystem_f42280 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function Avatar({
  initials,
  src,
  size = 32,
  tone = 'neutral',
  status
}) {
  const bg = tone === 'brand' ? 'var(--brand-primary)' : tone === 'navy' ? 'var(--brand-secondary)' : 'var(--slate-100)';
  const fg = tone === 'neutral' ? 'var(--text-heading)' : '#fff';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      width: size,
      height: size,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: src ? 'center/cover url(' + src + ')' : bg,
      color: fg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      font: '600 ' + Math.round(size * 0.36) + 'px/1 var(--font-sans)',
      border: '1px solid var(--border-default)'
    }
  }, !src && initials), status && /*#__PURE__*/React.createElement("i", {
    style: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      width: Math.max(8, size / 4),
      height: Math.max(8, size / 4),
      borderRadius: '50%',
      background: status === 'online' ? 'var(--green-600)' : 'var(--slate-400)',
      border: '2px solid #fff'
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
const T = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  premium: 'premium',
  neutral: 'neutral'
};
function Badge({
  tone = 'neutral',
  dot,
  solid,
  children,
  style
}) {
  if (tone === 'brand') return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 8px',
      borderRadius: 'var(--radius-pill)',
      background: solid ? 'var(--brand-primary)' : 'var(--brand-primary-soft)',
      color: solid ? '#fff' : 'var(--teal-800)',
      font: '500 11px/16px var(--font-sans)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("i", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 3,
      background: solid ? '#fff' : 'var(--brand-primary)'
    }
  }), children);
  const k = T[tone] || 'neutral';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '2px 8px',
      borderRadius: 'var(--radius-pill)',
      background: solid ? 'var(--status-' + k + '-dot)' : 'var(--status-' + k + '-bg)',
      color: solid ? '#fff' : 'var(--status-' + k + '-fg)',
      font: '500 11px/16px var(--font-sans)',
      whiteSpace: 'nowrap',
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("i", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 3,
      background: solid ? '#fff' : 'var(--status-' + k + '-dot)'
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function toPascal(n) {
  return String(n || '').split(/[-_ ]/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}
function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  color = 'currentColor',
  style
}) {
  const lib = typeof window !== 'undefined' ? window.lucide : null;
  const node = lib && lib.icons ? lib.icons[toPascal(name)] || lib.icons[name] : null;
  const kids = !node ? [] : node[0] === 'svg' ? node[2] : node;
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    style: {
      flexShrink: 0,
      display: 'block',
      ...style
    }
  }, (kids || []).map(([t, a], i) => React.createElement(t, {
    key: i,
    ...a
  })));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const {
  useState
} = React;
const V = {
  primary: {
    bg: 'var(--brand-primary)',
    hov: 'var(--brand-primary-hover)',
    act: 'var(--brand-primary-pressed)',
    fg: '#fff',
    bd: 'transparent'
  },
  secondary: {
    bg: 'var(--brand-secondary)',
    hov: 'var(--brand-secondary-hover)',
    act: 'var(--navy-800)',
    fg: '#fff',
    bd: 'transparent'
  },
  outline: {
    bg: '#fff',
    hov: 'var(--slate-50)',
    act: 'var(--slate-100)',
    fg: 'var(--text-body)',
    bd: 'var(--border-default)'
  },
  ghost: {
    bg: 'transparent',
    hov: 'var(--slate-100)',
    act: 'var(--slate-200)',
    fg: 'var(--text-secondary)',
    bd: 'transparent'
  },
  danger: {
    bg: 'transparent',
    hov: 'var(--red-50)',
    act: 'var(--red-100)',
    fg: 'var(--red-600)',
    bd: 'transparent'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled,
  fullWidth,
  children,
  onClick,
  type = 'button',
  style
}) {
  const [h, setH] = useState(false),
    [a, setA] = useState(false);
  const v = V[variant] || V.primary;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => {
      setH(false);
      setA(false);
    },
    onMouseDown: () => setA(true),
    onMouseUp: () => setA(false),
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      width: fullWidth ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: sm ? 6 : 8,
      height: sm ? 30 : 36,
      padding: sm ? '0 10px' : '0 14px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid ' + v.bd,
      background: disabled ? 'var(--slate-100)' : a ? v.act : h ? v.hov : v.bg,
      color: disabled ? 'var(--text-disabled)' : v.fg,
      font: '500 ' + (sm ? '12px' : '13px') + '/1 var(--font-sans)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
      boxShadow: variant === 'outline' ? 'var(--shadow-card)' : 'none',
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: sm ? 14 : 16
  }), children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: sm ? 14 : 16
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  title,
  subtitle,
  icon,
  action,
  accent = 'none',
  padding = 20,
  children,
  style
}) {
  const bar = accent === 'gold' ? 'var(--gold-500)' : accent === 'teal' ? 'var(--brand-primary)' : accent === 'navy' ? 'var(--brand-secondary)' : null;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderTop: bar ? '3px solid ' + bar : undefined,
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      padding,
      minWidth: 0,
      ...style
    }
  }, (title || action) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: children ? 16 : 0
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-md)',
      background: 'var(--brand-primary-soft)',
      color: 'var(--brand-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: 'var(--type-card-title)',
      color: 'var(--text-heading)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '2px 0 0',
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, subtitle)), action && /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0
    }
  }, action)), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
const {
  useState
} = React;
function DataTable({
  columns = [],
  rows = [],
  onRowClick,
  selectedIndex,
  rowKey
}) {
  const [hov, setHov] = useState(-1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      font: 'var(--type-body)'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: 'var(--surface-sunken)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || 'left',
      padding: '10px 16px',
      font: '500 11px/1.3 var(--font-sans)',
      letterSpacing: 'var(--ls-eyebrow)',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      borderBottom: '1px solid var(--border-default)',
      width: c.width,
      whiteSpace: 'nowrap'
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => {
    const sel = i === selectedIndex;
    return /*#__PURE__*/React.createElement("tr", {
      key: rowKey ? r[rowKey] : i,
      onClick: onRowClick ? () => onRowClick(r, i) : undefined,
      onMouseEnter: () => setHov(i),
      onMouseLeave: () => setHov(-1),
      style: {
        cursor: onRowClick ? 'pointer' : 'default',
        background: sel ? 'var(--teal-50)' : hov === i ? 'var(--slate-50)' : '#fff',
        boxShadow: sel ? 'inset 3px 0 0 var(--brand-primary)' : 'none'
      }
    }, columns.map(c => /*#__PURE__*/React.createElement("td", {
      key: c.key,
      style: {
        textAlign: c.align || 'left',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-default)',
        verticalAlign: 'middle',
        font: c.mono ? '500 13px var(--font-mono)' : undefined,
        color: c.mono ? 'var(--text-heading)' : 'var(--text-body)'
      }
    }, c.render ? c.render(r, i) : r[c.key])));
  }))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/ProgressBar.jsx
try { (() => {
const C = {
  teal: 'var(--brand-primary)',
  navy: 'var(--brand-secondary)',
  blue: 'var(--blue-500)',
  gold: 'var(--gold-500)',
  green: 'var(--green-600)',
  red: 'var(--red-600)'
};
function ProgressBar({
  value = 0,
  color = 'teal',
  height = 4,
  track = 'var(--slate-100)'
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      background: track,
      borderRadius: height,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: Math.max(0, Math.min(1, value)) * 100 + '%',
      height: '100%',
      background: C[color] || color,
      borderRadius: height
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function StatCard({
  label,
  value,
  unit,
  icon,
  iconTone = 'brand',
  delta,
  deltaTone = 'success',
  footer,
  progress,
  progressColor = 'teal',
  accent,
  mono
}) {
  const it = {
    brand: ['var(--brand-primary-soft)', 'var(--brand-primary)'],
    info: ['var(--blue-50)', 'var(--blue-500)'],
    premium: ['var(--gold-50)', 'var(--gold-500)'],
    success: ['var(--green-50)', 'var(--green-600)'],
    navy: ['var(--navy-50)', 'var(--brand-secondary)']
  }[iconTone] || ['var(--slate-100)', 'var(--text-secondary)'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      border: '1px solid var(--border-default)',
      borderTop: accent ? '3px solid var(--gold-500)' : undefined,
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: '500 11px/1.35 var(--font-sans)',
      letterSpacing: 'var(--ls-eyebrow)',
      textTransform: 'uppercase',
      color: accent ? 'var(--gold-700)' : 'var(--text-muted)'
    }
  }, label), icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 'var(--radius-sm)',
      background: it[0],
      color: it[1],
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: mono ? '600 26px/1.1 var(--font-mono)' : 'var(--type-kpi)',
      color: 'var(--text-heading)',
      letterSpacing: '-0.01em'
    }
  }, value), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 12px var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, unit), delta && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: deltaTone
  }, delta))), progress != null && /*#__PURE__*/React.createElement(__ds_scope.ProgressBar, {
    value: progress,
    color: progressColor
  }), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/1.4 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, footer));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
const {
  useState
} = React;
function Checkbox({
  checked,
  defaultChecked = false,
  onChange,
  label,
  description,
  meta,
  card,
  style
}) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const toggle = () => {
    setInner(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: toggle,
    role: "checkbox",
    "aria-checked": on,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      cursor: 'pointer',
      padding: card ? '12px 14px' : 0,
      background: card ? on ? 'var(--surface-sunken)' : '#fff' : 'transparent',
      border: card ? '1px solid var(--border-default)' : 0,
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      marginTop: 1,
      flexShrink: 0,
      borderRadius: 'var(--radius-xs)',
      border: '1.5px solid ' + (on ? 'var(--brand-secondary)' : 'var(--border-strong)'),
      background: on ? 'var(--brand-secondary)' : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, on && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 12,
    strokeWidth: 3,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '500 13px/1.4 var(--font-sans)',
      color: 'var(--text-body)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 2,
      font: '400 11px/1.45 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, description)), meta && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, meta));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioCard.jsx
try { (() => {
const {
  useState
} = React;
function RadioCard({
  options = [],
  value,
  defaultValue,
  onChange,
  columns
}) {
  const [inner, setInner] = useState(defaultValue ?? (options[0] && options[0].value));
  const cur = value ?? inner;
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + (columns || options.length) + ',minmax(0,1fr))',
      gap: 10
    }
  }, options.map(o => {
    const on = o.value === cur;
    return /*#__PURE__*/React.createElement("div", {
      key: o.value,
      role: "radio",
      "aria-checked": on,
      onClick: () => {
        setInner(o.value);
        onChange && onChange(o.value);
      },
      style: {
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '10px 12px',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        background: on ? 'var(--brand-primary-soft)' : '#fff',
        border: '1px solid ' + (on ? 'var(--teal-200)' : 'transparent')
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        font: '500 13px/1.35 var(--font-sans)',
        color: 'var(--text-body)'
      }
    }, o.label), o.description && /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        marginTop: 2,
        font: '400 11px/1.4 var(--font-sans)',
        color: 'var(--text-muted)'
      }
    }, o.description)), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 14,
        height: 14,
        marginTop: 2,
        borderRadius: '50%',
        border: '1.5px solid ' + (on ? 'var(--text-body)' : 'var(--border-strong)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }
    }, on && /*#__PURE__*/React.createElement("i", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 3,
        background: 'var(--text-body)'
      }
    })));
  }));
}
Object.assign(__ds_scope, { RadioCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/SelectField.jsx
try { (() => {
function SelectField({
  label,
  value,
  defaultValue,
  options = [],
  icon,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1.3 var(--font-sans)',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      height: 38,
      background: '#fff',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 12,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    color: "var(--gold-500)"
  })), /*#__PURE__*/React.createElement("select", {
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    style: {
      appearance: 'none',
      flex: 1,
      height: '100%',
      minWidth: 0,
      border: 0,
      outline: 0,
      background: 'transparent',
      padding: '0 32px 0 ' + (icon ? 34 : 12) + 'px',
      font: '400 13px var(--font-sans)',
      color: 'var(--text-body)',
      cursor: 'pointer'
    }
  }, options.map(o => typeof o === 'string' ? /*#__PURE__*/React.createElement("option", {
    key: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 10,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 15,
    color: "var(--text-muted)"
  }))));
}
Object.assign(__ds_scope, { SelectField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SelectField.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextField.jsx
try { (() => {
const {
  useState
} = React;
function TextField({
  label,
  value,
  defaultValue,
  placeholder,
  prefix,
  suffix,
  icon,
  hint,
  readOnly,
  mono,
  onChange,
  style
}) {
  const [f, setF] = useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 12px/1.3 var(--font-sans)',
      color: 'var(--text-secondary)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 38,
      padding: '0 12px',
      background: readOnly ? 'var(--surface-sunken)' : '#fff',
      border: '1px solid ' + (f ? 'var(--border-focus)' : 'var(--border-default)'),
      boxShadow: f ? 'var(--shadow-focus)' : 'none',
      borderRadius: 'var(--radius-sm)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 15,
    color: "var(--text-muted)"
  }), prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 13px var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, prefix), /*#__PURE__*/React.createElement("input", {
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    readOnly: readOnly,
    onChange: onChange,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 0,
      background: 'transparent',
      color: 'var(--text-body)',
      font: mono ? '500 13px var(--font-mono)' : '400 13px var(--font-sans)'
    }
  }), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px var(--font-sans)',
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, suffix)), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px/1.4 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, hint));
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextField.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
function Breadcrumbs({
  items = [],
  uppercase
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      font: (uppercase ? '500 11px' : '400 12px') + '/1.3 var(--font-sans)',
      letterSpacing: uppercase ? 'var(--ls-eyebrow)' : 0,
      textTransform: uppercase ? 'uppercase' : 'none'
    }
  }, items.map((t, i) => {
    const last = i === items.length - 1;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: last ? uppercase ? 'var(--brand-primary)' : 'var(--text-heading)' : 'var(--text-muted)',
        fontWeight: last ? 500 : undefined
      }
    }, t), !last && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 12,
      color: "var(--text-disabled)"
    }));
  }));
}
Object.assign(__ds_scope, { Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/FilterTabs.jsx
try { (() => {
const {
  useState
} = React;
function FilterTabs({
  tabs = [],
  activeId,
  defaultActiveId,
  onChange
}) {
  const [inner, setInner] = useState(defaultActiveId ?? (tabs[0] && tabs[0].id));
  const cur = activeId ?? inner;
  const dot = {
    warning: 'var(--amber-600)',
    success: 'var(--green-600)',
    info: 'var(--blue-500)',
    danger: 'var(--red-600)'
  };
  const fg = {
    warning: 'var(--amber-700)',
    success: 'var(--green-700)',
    info: 'var(--blue-700)',
    danger: 'var(--red-700)'
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap'
    }
  }, tabs.map(t => {
    const on = t.id === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => {
        setInner(t.id);
        onChange && onChange(t.id);
      },
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 26,
        padding: '0 10px',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        border: '1px solid ' + (on ? 'var(--brand-secondary)' : 'var(--border-default)'),
        background: on ? 'var(--brand-secondary)' : '#fff',
        color: on ? '#fff' : fg[t.tone] || 'var(--text-secondary)',
        font: '500 11px/1 var(--font-sans)',
        letterSpacing: t.uppercase ? '0.04em' : 0,
        textTransform: t.uppercase ? 'uppercase' : 'none',
        whiteSpace: 'nowrap'
      }
    }, t.tone && !on && /*#__PURE__*/React.createElement("i", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 3,
        background: dot[t.tone]
      }
    }), t.label, t.count != null && ' (' + t.count + ')');
  }));
}
Object.assign(__ds_scope, { FilterTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/FilterTabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Sidebar.jsx
try { (() => {
const {
  useState
} = React;
function Item({
  it,
  active,
  onSelect
}) {
  const [h, setH] = useState(false);
  return /*#__PURE__*/React.createElement("button", {
    onClick: () => onSelect && onSelect(it.id),
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      height: 32,
      padding: '0 10px',
      border: 0,
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      textAlign: 'left',
      background: active ? 'var(--nav-bg-active)' : h ? 'var(--nav-bg-hover)' : 'transparent',
      color: active || h ? 'var(--nav-text)' : 'var(--nav-text-muted)',
      font: (active ? '500' : '400') + ' 13px/1 var(--font-sans)'
    }
  }, it.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, it.label));
}
function Sidebar({
  sections = [],
  activeId,
  onSelect,
  logoSrc,
  productName = 'MGHPM',
  productTag = 'ENTERPRISE',
  badge = 'PRO',
  user,
  width = 208
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width,
      flexShrink: 0,
      background: 'var(--nav-bg)',
      color: 'var(--nav-text)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      alignSelf: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 52,
      padding: '0 12px',
      borderBottom: '1px solid var(--nav-divider)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 'var(--radius-sm)',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }
  }, logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: logoSrc,
    alt: "",
    style: {
      width: 26,
      height: 26,
      objectFit: 'contain'
    }
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '700 14px/1 var(--font-sans)',
      letterSpacing: '0.01em'
    }
  }, productName), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      marginTop: 3,
      font: '600 9px/1 var(--font-sans)',
      letterSpacing: '0.08em',
      color: 'var(--gold-500)'
    }
  }, productTag)), badge && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '2px 7px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--gold-500)',
      color: 'var(--gold-500)',
      background: 'rgba(212,166,55,0.12)',
      font: '600 10px/14px var(--font-sans)'
    }
  }, badge)), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      padding: '8px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      overflowY: 'auto'
    }
  }, sections.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 10px 6px',
      font: '500 10px/1 var(--font-sans)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--nav-section-label)'
    }
  }, s.label), s.items.map(it => /*#__PURE__*/React.createElement(Item, {
    key: it.id,
    it: it,
    active: it.id === activeId,
    onSelect: onSelect
  }))))), user && /*#__PURE__*/React.createElement("div", {
    style: {
      margin: 8,
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(0,0,0,0.14)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    initials: user.initials,
    size: 28,
    status: "online"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '500 12px/1.3 var(--font-sans)'
    }
  }, user.name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '400 11px/1.3 var(--font-sans)',
      color: 'var(--nav-text-muted)'
    }
  }, user.role)), user.status && /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '1px 7px',
      borderRadius: 'var(--radius-pill)',
      background: 'var(--green-100)',
      color: 'var(--green-700)',
      font: '500 10px/16px var(--font-sans)'
    }
  }, user.status)));
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Stepper.jsx
try { (() => {
function Stepper({
  steps = [],
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + steps.length + ',minmax(0,1fr))',
      gap: 8
    }
  }, steps.map((s, i) => {
    const done = s.status === 'done',
      act = s.status === 'active';
    const n = String(i + 1).padStart(2, '0');
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: onSelect ? () => onSelect(i) : undefined,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 'var(--radius-md)',
        cursor: onSelect ? 'pointer' : 'default',
        background: done ? 'var(--green-50)' : act ? 'var(--blue-50)' : 'var(--slate-100)',
        border: '1px solid ' + (done ? 'var(--green-100)' : act ? 'var(--blue-100)' : 'transparent')
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 24,
        height: 24,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: '600 11px var(--font-sans)',
        background: done ? 'var(--green-600)' : act ? 'var(--blue-500)' : '#fff',
        color: done || act ? '#fff' : 'var(--text-muted)',
        border: done || act ? 0 : '1px solid var(--border-default)'
      }
    }, done ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "check",
      size: 13,
      strokeWidth: 3
    }) : n), /*#__PURE__*/React.createElement("span", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        font: '500 10px/1.3 var(--font-sans)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: done ? 'var(--green-700)' : act ? 'var(--blue-700)' : 'var(--text-muted)'
      }
    }, "Step ", n, done ? ' • Active' : act ? ' • Underway' : ''), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'block',
        font: '500 12px/1.3 var(--font-sans)',
        color: 'var(--text-body)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    }, s.label)));
  }));
}
Object.assign(__ds_scope, { Stepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Stepper.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
function TopBar({
  searchPlaceholder = 'Search units, leases, work orders, ledgers…',
  portfolio = 'All Portfolios - Miami Metro',
  onNew,
  notifications = true,
  user
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 52,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
      background: '#fff',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '0 1 360px',
      minWidth: 120,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 34,
      padding: '0 10px',
      background: 'var(--slate-100)',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: '400 12px var(--font-sans)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, searchPlaceholder), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: '1px 5px',
      border: '1px solid var(--border-default)',
      borderRadius: 4,
      font: '500 10px var(--font-sans)',
      background: '#fff'
    }
  }, "\u2318K")), portfolio && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 34,
      padding: '0 10px',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      font: '400 12px var(--font-sans)',
      color: 'var(--text-body)',
      whiteSpace: 'nowrap'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "building-2",
    size: 15,
    color: "var(--gold-500)"
  }), portfolio, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 14,
    color: "var(--text-muted)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    icon: "plus",
    onClick: onNew
  }, "New"), notifications && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      color: 'var(--text-secondary)',
      padding: 6
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "bell",
    size: 18
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 7,
      height: 7,
      borderRadius: 4,
      background: 'var(--red-500)',
      border: '1.5px solid #fff'
    }
  })), user && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    initials: user.initials,
    tone: "brand",
    size: 30
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      lineHeight: 1.2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '500 12px var(--font-sans)',
      color: 'var(--text-heading)'
    }
  }, user.name), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      font: '400 11px var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, user.role))));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mghpm-enterprise/App.jsx
try { (() => {
const {
  Sidebar,
  TopBar,
  Icon
} = window.MGHPMDesignSystem_f42280;
const SECTIONS = [{
  label: 'Main',
  items: [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'layout-grid'
  }, {
    id: 'properties',
    label: 'Properties',
    icon: 'building-2'
  }, {
    id: 'tenants',
    label: 'Tenants & Leases',
    icon: 'key-round'
  }]
}, {
  label: 'Operations',
  items: [{
    id: 'maintenance',
    label: 'Maintenance & Work Orders',
    icon: 'wrench'
  }, {
    id: 'inspections',
    label: 'Digital Inspections',
    icon: 'list-checks'
  }]
}, {
  label: 'Finance',
  items: [{
    id: 'accounting',
    label: 'Accounting & Statements',
    icon: 'landmark'
  }, {
    id: 'owners',
    label: 'Owner Portals',
    icon: 'house'
  }, {
    id: 'reports',
    label: 'Reports',
    icon: 'chart-line'
  }]
}, {
  label: 'System',
  items: [{
    id: 'settings',
    label: 'Settings',
    icon: 'settings'
  }, {
    id: 'help',
    label: 'Help & Support',
    icon: 'circle-help'
  }]
}];
const SCREENS = {
  dashboard: 'OwnerPortal',
  owners: 'OwnerPortal',
  properties: 'NewLease',
  tenants: 'Leasing',
  maintenance: 'WorkOrders',
  reports: 'Reports'
};
function Empty({
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 60,
      textAlign: 'center',
      color: 'var(--text-muted)',
      font: 'var(--type-body)',
      border: '1px dashed var(--border-strong)',
      borderRadius: 12,
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-question",
    size: 24,
    style: {
      margin: '0 auto 10px'
    }
  }), "\u201C", label, "\u201D was not in the provided screenshots \u2014 intentionally left blank.");
}
function App() {
  const [page, setPage] = React.useState(() => localStorage.getItem('mghpm-page') || 'dashboard');
  React.useEffect(() => {
    localStorage.setItem('mghpm-page', page);
    const m = document.querySelector('main');
    if (m) m.scrollTop = 0;
  }, [page]);
  const S = window[SCREENS[page]];
  const label = SECTIONS.flatMap(s => s.items).find(i => i.id === page)?.label;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100vh',
      background: 'var(--surface-page)'
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    sections: SECTIONS,
    activeId: page,
    onSelect: setPage,
    logoSrc: "../../assets/logo-mark.png",
    user: {
      name: 'Marcus Vance',
      role: 'Portfolio Lead',
      initials: 'MV',
      status: 'Active'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    onNew: () => setPage('properties'),
    user: {
      name: 'Marcus Vance',
      role: 'Portfolio Lead',
      initials: 'MV'
    }
  }), /*#__PURE__*/React.createElement("main", {
    "data-screen-label": label,
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1280,
      margin: '0 auto'
    }
  }, S ? /*#__PURE__*/React.createElement(S, null) : /*#__PURE__*/React.createElement(Empty, {
    label: label
  })))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mghpm-enterprise/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mghpm-enterprise/Leasing.jsx
try { (() => {
const {
  Button,
  Badge,
  Avatar,
  Card,
  Icon,
  TextField,
  SelectField,
  Checkbox,
  RadioCard,
  StatCard,
  ProgressBar,
  DataTable,
  Breadcrumbs,
  Stepper,
  FilterTabs
} = window.MGHPMDesignSystem_f42280;
const apps = [{
  i: 'MG',
  n: 'Maria Garcia',
  id: 'App ID #MGH-9821',
  u: 'Ocean View Villa',
  r: '$8,450.00 / mo',
  s: 785,
  tier: 'TIER 1',
  inc: '$245,000 / yr',
  st: ['success', 'Approved - Lease Issued'],
  a: 'View Dossier'
}, {
  i: 'AW',
  n: 'Dr. Alexander Wright',
  id: 'App ID #MGH-9824',
  u: 'Brickell Bayline Suite 1402',
  r: '$6,200.00 / mo',
  s: 742,
  tier: 'TIER 1',
  inc: '$195,000 / yr',
  st: ['warning', 'Review Escrow Terms'],
  a: 'Review & Sign'
}, {
  i: 'SM',
  n: 'Sophia Martinez',
  id: 'App ID #MGH-9818',
  u: 'Sunset Palms Fourplex #3B',
  r: '$2,850.00 / mo',
  s: 698,
  tier: 'TIER 2',
  inc: '$88,000 / yr',
  st: ['warning', '1 Minor Flag (Utility)'],
  a: 'Review Credit'
}, {
  i: 'DH',
  n: 'David Henderson',
  id: 'App ID #MGH-9812',
  u: 'Las Olas Waterfront Townhome',
  r: '$7,200.00 / mo',
  s: 760,
  tier: 'TIER 1',
  inc: '$210,000 / yr',
  st: ['info', 'Pending Background'],
  a: 'Ping TransUnion'
}];
function Leasing() {
  const [sel, setSel] = React.useState(1);
  const a = apps[sel];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
    uppercase: true,
    crumbs: ['MGHPM', 'Portals & Leasing', 'Rental Applications & Screening'],
    title: "Rental Applications & Underwriting Pipeline",
    subtitle: "Autonomous FCRA-compliant applicant screening, TransUnion credit evaluation, fiduciary income verification, and lease offer dispatch.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      icon: "download"
    }, "Export Underwriting Log (CSV)"), /*#__PURE__*/React.createElement(Button, {
      icon: "user-plus"
    }, "Invite New Applicant"))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(FilterTabs, {
    tabs: [{
      id: 'all',
      label: 'All Applications',
      count: 14,
      uppercase: true
    }, {
      id: 'n',
      label: 'Needs Review',
      count: 3,
      tone: 'warning',
      uppercase: true
    }, {
      id: 'a',
      label: 'Approved',
      count: 8,
      tone: 'success',
      uppercase: true
    }, {
      id: 'p',
      label: 'Pending TransUnion',
      count: 2,
      tone: 'info',
      uppercase: true
    }, {
      id: 'd',
      label: 'Declined',
      count: 1,
      tone: 'danger',
      uppercase: true
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: grid4
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Pipeline Velocity",
    value: "14",
    unit: "Active Apps",
    icon: "gauge",
    iconTone: "neutral",
    footer: "Avg. Turnaround 4.2 Hours"
  }), /*#__PURE__*/React.createElement(StatCard, {
    accent: true,
    label: "Underwriting Pass Rate",
    value: "78.5%",
    icon: "badge-check",
    iconTone: "premium",
    delta: "Tier 1",
    deltaTone: "premium",
    footer: "TransUnion Sovereign \xB7 \u2265 720 FICO Score"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Verified Monthly Income",
    value: "$142,800",
    mono: true,
    icon: "landmark",
    iconTone: "info",
    delta: "\u2197 2.4x",
    footer: "Average Rent-to-Income \xB7 24% Portfolio DTI"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Active Underwriting Stage",
    value: "4 Units",
    icon: "house",
    iconTone: "neutral",
    delta: "High Demand",
    footer: "100% Filled"
  })), /*#__PURE__*/React.createElement("div", {
    style: split
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Card, {
    icon: "clipboard-check",
    title: "Active Applications & Underwriting Roster",
    subtitle: "Live stream of candidate credit files, bank verifications, and background telemetry",
    padding: 0,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 2
    }
  }), /*#__PURE__*/React.createElement(DataTable, {
    selectedIndex: sel,
    onRowClick: (r, i) => setSel(i),
    rows: apps,
    columns: [{
      key: 'n',
      label: 'Applicant & Dossier',
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }
      }, /*#__PURE__*/React.createElement(Avatar, {
        initials: r.i,
        tone: r.i === 'AW' ? 'navy' : 'neutral'
      }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 500
        }
      }, r.n), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: 'var(--text-muted)'
        }
      }, r.id)))
    }, {
      key: 'u',
      label: 'Target Unit & Rent',
      render: r => /*#__PURE__*/React.createElement("div", null, r.u, /*#__PURE__*/React.createElement("div", {
        style: {
          font: '400 11px var(--font-mono)',
          color: 'var(--text-muted)'
        }
      }, r.r))
    }, {
      key: 's',
      label: 'TransUnion & Income',
      render: r => /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
        style: {
          font: '600 14px var(--font-mono)',
          color: 'var(--brand-primary)'
        }
      }, r.s), " ", /*#__PURE__*/React.createElement("span", {
        style: {
          font: '500 9px var(--font-sans)',
          color: 'var(--gold-700)'
        }
      }, r.tier), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: 'var(--text-muted)'
        }
      }, r.inc))
    }, {
      key: 'st',
      label: 'Screening Status',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        tone: r.st[0]
      }, r.st[1])
    }, {
      key: 'a',
      label: 'Action',
      align: 'right',
      render: (r, i) => i === sel ? /*#__PURE__*/React.createElement(Button, {
        size: "sm"
      }, r.a) : /*#__PURE__*/React.createElement(Button, {
        size: "sm",
        variant: "ghost"
      }, r.a)
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    accent: "navy",
    title: 'Underwriting Dossier: ' + a.n,
    subtitle: 'Target: ' + a.u + ' • Lease Term: 12 Months',
    action: /*#__PURE__*/React.createElement("span", {
      style: {
        font: '500 12px var(--font-mono)',
        padding: '6px 10px',
        background: 'var(--slate-100)',
        borderRadius: 6
      }
    }, "Monthly: ", a.r.replace(' / mo', ''))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "ResidentScore 4.0",
    value: a.s,
    unit: "/850",
    mono: true,
    progress: a.s / 850,
    progressColor: "teal",
    footer: "Optimal Risk Profile"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Total DTI Ratio",
    value: "18.2%",
    mono: true,
    progress: 0.48,
    progressColor: "navy",
    footer: "Threshold: 38%"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Fiduciary Employment",
    value: "6.2 Yrs",
    footer: "Verified employer"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Records Audit",
    value: "0",
    mono: true,
    footer: "0 Evictions \u2022 0 Liens"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 14,
      background: 'var(--gold-50)',
      border: '1px solid var(--gold-100)',
      borderRadius: 8,
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "badge-check",
    size: 22,
    color: "var(--gold-500)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      font: 'var(--type-small)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--text-heading)',
      fontWeight: 600,
      fontSize: 13
    }
  }, "Autonomous Recommendation: Approve with Standard 2x Escrow"), /*#__PURE__*/React.createElement("br", null), "Complies with Florida Statutes \xA7 83.49. Security deposit to be segregated in Prime Escrow Account."), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px var(--font-mono)',
      color: 'var(--gold-700)'
    }
  }, "CONFIDENCE 99.4%")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      marginTop: 16,
      justifyContent: 'flex-end',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    icon: "gavel"
  }, "Decline with Adverse Action Notice"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    icon: "file-text"
  }, "Request Additional Proof of Income"), /*#__PURE__*/React.createElement(Button, {
    icon: "circle-check"
  }, "Approve & Generate Lease Offer")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    icon: "shield",
    title: "Fiduciary Vetting Criteria",
    action: /*#__PURE__*/React.createElement(Badge, null, "FL STAT.")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, [['Minimum Credit Score (680)', 'Tier 1 Sovereign standard reserved for ≥ 720 FICO.'], ['Gross Income Requirement (3.0x)', 'Gross verifiable monthly revenue must equal or exceed triple the base rent.'], ['Zero Eviction / Felony Standard', 'Nationwide 7-year background screening.'], ['Escrow Statutory Compliance', 'FL Stat. § 83.49 requires 2x security deposit segregated.']].map(([t, d]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      gap: 8,
      padding: 10,
      background: 'var(--surface-sunken)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 15,
    color: "var(--green-600)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 13px var(--font-sans)'
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px/1.4 var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, d)))))), /*#__PURE__*/React.createElement(Card, {
    icon: "workflow",
    title: "Pipeline Integrations"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [['TU', 'TransUnion ResidentScore 4.0', 'Active', 'info'], ['PL', 'Plaid Asset & Income API', 'Connected', 'success'], ['FC', 'FCRA Adverse Action Engine', 'Enforced', 'success']].map(([i, t, s, k]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      padding: 10,
      background: 'var(--surface-sunken)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    initials: i,
    size: 28
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: '500 12px var(--font-sans)'
    }
  }, t), /*#__PURE__*/React.createElement(Badge, {
    tone: k
  }, s))))))));
}
window.Leasing = Leasing;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mghpm-enterprise/Leasing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mghpm-enterprise/NewLease.jsx
try { (() => {
const {
  Button,
  Badge,
  Avatar,
  Card,
  Icon,
  TextField,
  SelectField,
  Checkbox,
  RadioCard,
  StatCard,
  ProgressBar,
  DataTable,
  Breadcrumbs,
  Stepper,
  FilterTabs
} = window.MGHPMDesignSystem_f42280;
function NewLease() {
  const [step, setStep] = React.useState(1);
  const st = i => i < step ? 'done' : i === step ? 'active' : 'todo';
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 20
    },
    padding: 16
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Breadcrumbs, {
    items: ['MGHPM', 'Operations & Leasing', 'Master Form Initiation', 'New Institutional Lease & Service Agreement']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "premium"
  }, "Institutional Certified Form Tier"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, "Template FL-STAT-83 Rev. 2025/Q2"))), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    icon: "save"
  }, "Save as Draft"), /*#__PURE__*/React.createElement(Button, {
    icon: "lock"
  }, "Submit & Issue for Signature"))), /*#__PURE__*/React.createElement(PageHeader, {
    crumbs: [],
    title: "Execute New Residential Lease & Onboarding Dossier",
    subtitle: "Standard Florida Statutory Fiduciary Lease Template (FL-STAT-83) with Automated Escrow Integration & Pre-authorized Maintenance Protocols.",
    actions: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid var(--border-default)',
        borderRadius: 8
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "shield-check",
      size: 18,
      color: "var(--brand-primary)"
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        font: 'var(--type-eyebrow)',
        letterSpacing: 'var(--ls-eyebrow)',
        color: 'var(--text-muted)'
      }
    }, "FIDUCIARY AUDIT STATUS"), /*#__PURE__*/React.createElement("div", {
      style: {
        font: '500 12px var(--font-sans)'
      }
    }, "Compliant & Escrow-Insured")))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(Stepper, {
    onSelect: setStep,
    steps: ['Asset & Unit Select', 'Tenant Vetting', 'Financials & Escrow', 'Addenda & DocuSign'].map((l, i) => ({
      label: l,
      status: st(i)
    }))
  })), /*#__PURE__*/React.createElement("div", {
    style: split
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Card, {
    icon: "building",
    title: "1. Target Property & Space Specification",
    subtitle: "Verify Florida portfolio registry details, occupancy limits and zoning classifications.",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "success"
    }, "Occupancy Ready")
  }, /*#__PURE__*/React.createElement(SelectField, {
    label: "Primary Asset Portfolio Selector",
    icon: "building-2",
    options: ['Ocean View Villa — 123 Beach St, Miami Beach, FL 33139 (Units 101/102)']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      margin: '14px 0',
      padding: 12,
      background: 'var(--surface-sunken)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement(Photo, {
    w: 72,
    h: 52
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 13px var(--font-sans)'
    }
  }, "Ocean View Villa \u2022 Miami Beach"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, "Parcel ID: 02-3214-041-0010 \u2022 4 Beds \xB7 3 Baths \xB7 3,820 sq ft")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, "Appraised Market Rent"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '600 22px var(--font-sans)',
      color: 'var(--text-heading)'
    }
  }, "$8,450"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--text-muted)'
    }
  }, "/mo"))), /*#__PURE__*/React.createElement(RadioCard, {
    options: [{
      value: '12',
      label: '12-Month Fixed',
      description: 'Standard annual residential tenancy contract.'
    }, {
      value: '24',
      label: '24-Month Executive',
      description: 'Long-term lease with index rate adjustment cap.'
    }, {
      value: 'c',
      label: 'Corporate Rolling',
      description: 'Enterprise furnished executive agreement.'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Lease Commencement Date",
    icon: "calendar",
    defaultValue: "Aug 01, 2025"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Lease Termination Date",
    icon: "calendar",
    defaultValue: "Jul 31, 2026"
  }))), /*#__PURE__*/React.createElement(Card, {
    icon: "landmark",
    title: "3. Fiduciary Rent & Statutory Escrow Matrix",
    subtitle: "Stipulated under Florida Statute 83.49 for fiduciary segregation of client funds.",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "premium"
    }, "Escrow Bonded Acct")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Monthly Base Rent (USD)",
    prefix: "$",
    mono: true,
    defaultValue: "8,450.00",
    suffix: "Due 1st"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Statutory Security Deposit (2x)",
    prefix: "$",
    mono: true,
    defaultValue: "16,900.00",
    suffix: "Chase #\u2022\u2022\u2022\u20224401"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    card: true,
    defaultChecked: true,
    label: "Automated ACH Direct Debit Mandate",
    description: "Recurring monthly auto-sweep scheduled for every 1st of calendar month. Zero transactional surcharge."
  }))), /*#__PURE__*/React.createElement(Card, {
    icon: "scale",
    title: "4. Statutory Addenda & Dispatch Thresholds",
    subtitle: "Autonomous maintenance delegation limit and institutional compliance riders.",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "info"
    }, "FL-SPEC-2025")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    card: true,
    defaultChecked: true,
    label: "Lead-Based Paint Disclosure (EPA Title X)",
    description: "Mandatory federal disclosure documentation attached and verified."
  }), /*#__PURE__*/React.createElement(Checkbox, {
    card: true,
    defaultChecked: true,
    label: "Hurricane & Windstorm Preparedness Rider",
    description: "Mandatory shutter deployment and storm shutter insurance clauses."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Tenant Repair Deductible Limit",
    defaultValue: "$150.00 / incident",
    hint: "Tenant responsibility cap for routine minor service dispatches."
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Auto-Dispatch Emergency HVAC / Plumbing Threshold",
    defaultValue: "$750.00 max auto-authorization",
    hint: "Instant vendor assignment without requiring owner pre-clearance."
  })))), /*#__PURE__*/React.createElement(Card, {
    title: "Contract Summary",
    icon: "star",
    subtitle: "#MIA-OV-10102"
  }, /*#__PURE__*/React.createElement(Photo, {
    w: "100%",
    h: 110,
    label: "Ocean View Villa"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      color: 'var(--text-muted)',
      margin: '16px 0 8px'
    }
  }, "CLOSING FINANCIAL ESCROW"), [['First Month Rent', '$8,450.00'], ['Security Deposit (Escrow)', '$16,900.00'], ['Processing & Statutory Filing', '$0.00']].map(([a, b]) => /*#__PURE__*/React.createElement("div", {
    key: a,
    style: {
      display: 'flex',
      padding: '6px 0',
      font: 'var(--type-small)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, a), /*#__PURE__*/React.createElement(Money, {
    v: b,
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      margin: '10px 0',
      padding: 12,
      background: 'var(--surface-sunken)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: '500 12px var(--font-sans)'
    }
  }, "Total Move-In Funds Due:"), /*#__PURE__*/React.createElement(Money, {
    v: "$25,350.00",
    size: 16
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)',
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Underwriting Risk Score"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px var(--font-mono)',
      color: 'var(--green-700)'
    }
  }, "Low Risk \u2022 99.2 / 100")), /*#__PURE__*/React.createElement(ProgressBar, {
    value: 0.99,
    color: "green",
    height: 5
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    icon: "send",
    fullWidth: true
  }, "Issue Digital Lease Packet"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "eye",
    fullWidth: true
  }, "Preview Draft Agreement (PDF)")))));
}
window.NewLease = NewLease;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mghpm-enterprise/NewLease.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mghpm-enterprise/OwnerPortal.jsx
try { (() => {
const {
  Button,
  Badge,
  Avatar,
  Card,
  Icon,
  TextField,
  SelectField,
  Checkbox,
  RadioCard,
  StatCard,
  ProgressBar,
  DataTable,
  Breadcrumbs,
  Stepper,
  FilterTabs
} = window.MGHPMDesignSystem_f42280;
const assets = [{
  n: 'Ocean View Villa',
  a: '123 Beach St, Miami Beach, FL',
  u: '1 Unit',
  t: 'Luxury SFH',
  g: '$8,450.00',
  o: '-$1,250.00'
}, {
  n: 'Brickell Bayline Suite 1402',
  a: '1150 Brickell Ave, Miami, FL',
  u: '1 Unit',
  t: 'High-Rise Condo',
  g: '$6,200.00',
  o: '-$980.00'
}, {
  n: 'Sunset Palms Fourplex',
  a: '420 Santander Ave, Coral Gables, FL',
  u: '4 Units',
  t: 'Multi-Family',
  g: '$18,400.00',
  o: '-$2,840.00'
}, {
  n: 'Las Olas Waterfront Townhome',
  a: '804 SE 25th Ave, Ft Lauderdale, FL',
  u: '2 Units',
  t: 'Townhouse Luxury',
  g: '$12,800.00',
  o: '-$1,940.00'
}];
const breakdown = [['plus', 'Gross Portfolio Rental Receipts (May 2025)', '$56,200.00'], ['minus', 'Contractual Management Fee (8.0%)', '-$4,496.00'], ['minus', 'Capex & Routine Maintenance Escrow Retention', '-$6,254.00'], ['minus', 'Ad Valorem Property Tax Escrow Allocation', '-$3,300.00']];
function OwnerPortal() {
  const [sel, setSel] = React.useState(0);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
    crumbs: ['MGHPM', 'Finance & Portals', 'Owner Capital & Distribution Portal'],
    title: "Owner Portal \u2014 Capital Distributions & Asset Yield",
    badge: /*#__PURE__*/React.createElement(Badge, {
      tone: "premium"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "badge-check",
      size: 12
    }), "VERIFIED TRUST / INSTITUTIONAL ACCOUNT"),
    subtitle: "Fiduciary capital account tracking, net yield allocations, monthly financial disbursements, and IRS tax reporting packages.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      icon: "file-text"
    }, "Download 1099-MISC & Tax Ledger"), /*#__PURE__*/React.createElement(Button, {
      icon: "landmark"
    }, "Initiate Capital Distribution"))
  }), /*#__PURE__*/React.createElement("div", {
    style: grid4
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Total Portfolio Equity",
    value: "$9,420,000.00",
    mono: true,
    icon: "building",
    iconTone: "neutral",
    delta: "\u2191 +4.8%",
    footer: "vs last fiscal appraisal"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "YTD Net Distributed Yield",
    value: "$318,450.00",
    mono: true,
    icon: "wallet",
    iconTone: "brand",
    delta: "Next: Jun 1",
    deltaTone: "info",
    footer: "Direct trust wire"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Undistributed Escrow Reserve",
    value: "$52,800.00",
    mono: true,
    icon: "lock",
    iconTone: "neutral",
    delta: "105.6% Funded",
    footer: "$50K mandatory policy"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Portfolio Occupancy",
    value: "96.4%",
    mono: true,
    icon: "key-round",
    iconTone: "neutral",
    footer: "8 of 8 Doors Active \xB7 Avg tenant stay: 2.4 yrs"
  })), /*#__PURE__*/React.createElement("div", {
    style: split
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Card, {
    icon: "shield-check",
    title: "Next Capital Distribution Disbursement",
    subtitle: "Clearing Date: June 1, 2025 \u2022 Federal Wire Transfer",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "success",
      dot: true
    }, "Approved & Scheduled")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr 1fr',
      gap: 16,
      padding: '16px 0',
      borderTop: '1px solid var(--border-default)',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      color: 'var(--text-muted)'
    }
  }, "NET APPROVED PAYOUT"), /*#__PURE__*/React.createElement(Money, {
    v: "$42,150.00",
    size: 24
  })), /*#__PURE__*/React.createElement(KV, {
    k: "Target Beneficiary",
    v: "Robert Johnson Family Trust"
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Authorization Reference",
    v: "FEDW-2025-06-0081",
    mono: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-eyebrow)',
      letterSpacing: 'var(--ls-eyebrow)',
      color: 'var(--text-muted)',
      margin: '16px 0 8px'
    }
  }, "DISBURSEMENT CALCULATION BREAKDOWN (MAY OPERATING CLOSE)"), /*#__PURE__*/React.createElement("div", {
    style: {
      border: '1px solid var(--border-default)',
      borderRadius: 8
    }
  }, breakdown.map(([i, l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 14px',
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: 'circle-' + i,
    size: 15,
    color: "var(--text-muted)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: 'var(--type-body)'
    }
  }, l), /*#__PURE__*/React.createElement(Money, {
    v: v,
    neg: v[0] === '-'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      background: 'var(--teal-50)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "landmark",
    size: 15,
    color: "var(--brand-primary)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: '600 13px var(--font-sans)'
    }
  }, "Net Direct Fiduciary Deposit"), /*#__PURE__*/React.createElement(Money, {
    v: "$42,150.00",
    size: 16
  })))), /*#__PURE__*/React.createElement(Card, {
    title: "Asset Performance Breakdown",
    subtitle: "Entity property cash yield and reserve retention across all active holdings.",
    action: /*#__PURE__*/React.createElement(Badge, null, "4 Properties / 8 Doors"),
    padding: 0,
    style: {
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4
    }
  }), /*#__PURE__*/React.createElement(DataTable, {
    selectedIndex: sel,
    onRowClick: (r, i) => setSel(i),
    rows: assets,
    columns: [{
      key: 'n',
      label: 'Property Asset',
      render: r => /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }
      }, /*#__PURE__*/React.createElement(Photo, {
        w: 32,
        h: 32
      }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontWeight: 500
        }
      }, r.n), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: 'var(--text-muted)'
        }
      }, r.a)))
    }, {
      key: 'u',
      label: 'Units / Type',
      render: r => /*#__PURE__*/React.createElement("div", null, r.u, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: 'var(--text-muted)'
        }
      }, r.t))
    }, {
      key: 'g',
      label: 'Gross Inflow',
      align: 'right',
      mono: true
    }, {
      key: 'o',
      label: 'OpEx / Exp',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement(Money, {
        v: r.o,
        neg: true
      })
    }]
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Fiduciary Entity",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "premium"
    }, "Active W-9")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(KV, {
    k: "Trust Legal Title",
    v: "Robert Johnson Family Trust"
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Entity Tax Identification",
    v: "EIN \u2022\u2022\u2022\u2022\u20228841",
    mono: true
  }), /*#__PURE__*/React.createElement(KV, {
    k: "Direct Wire Settlement Route",
    v: "JPMorgan Chase Bank, N.A."
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    icon: "landmark",
    fullWidth: true
  }, "Update Distribution Banking"))), /*#__PURE__*/React.createElement(Card, {
    title: "Operating Reserve Escrow",
    action: /*#__PURE__*/React.createElement(Icon, {
      name: "shield",
      size: 16,
      color: "var(--text-muted)"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--brand-primary)'
    }
  }, "Current Escrow Level"), /*#__PURE__*/React.createElement(Money, {
    v: "$52,800.00",
    size: 16
  })), /*#__PURE__*/React.createElement(ProgressBar, {
    value: 1,
    color: "teal",
    height: 6
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 6,
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "Required: $50,000.00"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--green-700)'
    }
  }, "105.6% Solvency"))), /*#__PURE__*/React.createElement(Card, {
    title: "Tax & Compliance Vault",
    action: /*#__PURE__*/React.createElement(Icon, {
      name: "folder",
      size: 16,
      color: "var(--text-muted)"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [['2024 Form 1099-MISC', 'Final IRS Certified Copy'], ['2024 Schedule E Property Ledger', 'CPA Audited Breakdown'], ['Q1 2025 Depreciation Schedule', 'MACRS Modified Report']].map(([a, b]) => /*#__PURE__*/React.createElement("div", {
    key: a,
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      padding: 10,
      border: '1px solid var(--border-default)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 16,
    color: "var(--blue-500)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px var(--font-sans)'
    }
  }, a), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, b)), /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 14,
    color: "var(--text-muted)"
  }))))))));
}
window.OwnerPortal = OwnerPortal;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mghpm-enterprise/OwnerPortal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mghpm-enterprise/Reports.jsx
try { (() => {
const {
  Button,
  Badge,
  Avatar,
  Card,
  Icon,
  TextField,
  SelectField,
  Checkbox,
  RadioCard,
  StatCard,
  ProgressBar,
  DataTable,
  Breadcrumbs,
  Stepper,
  FilterTabs
} = window.MGHPMDesignSystem_f42280;
const months = [['JAN', 78, 14, 58], ['FEB', 80, 16, 60], ['MAR', 82, 12, 62], ['APR', 86, 10, 66], ['MAY', 92, 12, 70]];
const reports = [['wallet', 'Monthly Fiduciary Owner Statement', 'Itemized rental ledgers, operating expense deductions, maintenance reserves, and net disbursement calculations per portfolio.', ['success', 'GAAP Compliant'], 'Generate Now', 'PDF', 'teal'], ['list', 'Rent Roll & Lease Expiration Schedule', 'Tenant identity ledger, security deposit tallies, contract end dates, and contractual 4.5% annual escalation schedules.', ['info', 'All 150 Doors'], 'Audit Roll', 'Export', 'teal'], ['shield-check', 'Florida Statutory Escrow & Trust Audit', 'Three-way security deposit reconciliation report confirming segregated holding accounts.', ['premium', 'FL § 83.49 Certified'], 'View Shield', 'Certified Pack', 'gold'], ['receipt-text', 'IRS Form 1099-MISC & Year-End Tax Packet', 'Comprehensive annual tax depreciation summaries, vendor expense classifications, and K-1 statements.', ['premium', 'Schedule E Ready'], 'Re-Compile', 'Vault ZIP', 'navy']];
function Reports() {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Card, {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(PageHeader, {
    uppercase: true,
    crumbs: ['Operations & Finance', 'Reports & Intelligence'],
    title: "Reports & Portfolio Intelligence",
    subtitle: "Fiduciary asset performance analytics, GAAP financial statements, tax reporting vaults, and operational SLA intelligence.",
    actions: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 260
      }
    }, /*#__PURE__*/React.createElement(SelectField, {
      icon: "calendar",
      options: ['FY 2025 YTD (Jan - May)']
    }), /*#__PURE__*/React.createElement(SelectField, {
      icon: "building-2",
      options: ['All Portfolios - Miami Metro']
    }), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "plus"
    }, "Schedule Custom Report"))
  })), /*#__PURE__*/React.createElement("div", {
    style: grid4
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Consolidated NOI",
    value: "$482,650.00",
    icon: null,
    delta: "+8.4% YoY",
    footer: "GAAP Certified \u2022 After OpEx Deductions"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Average Occupancy",
    value: "96.2%",
    delta: "+4.7% vs Index",
    footer: "Miami Luxury Benchmark: 91.5%"
  }), /*#__PURE__*/React.createElement(StatCard, {
    accent: true,
    label: "Escrow Security Shield",
    value: "$128,400.00",
    delta: "FL \xA7 83.49",
    deltaTone: "premium",
    footer: "100% Segregated Non-Commingled"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "CapEx Efficiency",
    value: "4.8%",
    delta: "Optimal Band",
    deltaTone: "info",
    footer: "Gross Revenue Ratio (<6.0% Ceiling)"
  })), /*#__PURE__*/React.createElement("div", {
    style: split
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Executive Financial Velocity & NOI Trajectory",
    subtitle: "Gross Rental Collections vs Operating Costs across Miami Metropolitan doors (Jan - May 2025)",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        font: 'var(--type-small)',
        color: 'var(--text-secondary)'
      }
    }, [['Gross Revenue', 'chart-1'], ['Operating Expenses', 'chart-3'], ['Net Income', 'chart-2']].map(([t, k]) => /*#__PURE__*/React.createElement("span", {
      key: t,
      style: {
        display: 'flex',
        gap: 5,
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 4,
        background: 'var(--' + k + ')'
      }
    }), t)))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-sunken)',
      borderRadius: 8,
      padding: '24px 20px 12px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 220
    }
  }, months.map(([m, a, b, c]) => /*#__PURE__*/React.createElement("div", {
    key: m,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      alignItems: 'flex-end',
      height: 170
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: 18,
      height: a * 1.8,
      background: 'var(--chart-1)',
      borderRadius: '3px 3px 0 0'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 18,
      height: b * 1.8,
      background: 'var(--chart-3)',
      borderRadius: '3px 3px 0 0'
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: 18,
      height: c * 1.8,
      background: 'var(--chart-2)',
      borderRadius: '3px 3px 0 0'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 10px var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, m))))), /*#__PURE__*/React.createElement(Card, {
    title: "Standard Production Reports Library",
    subtitle: "Institutional dossiers compliant with Florida Real Estate Commission & IRS Schedule E guidelines",
    action: /*#__PURE__*/React.createElement(Badge, null, "5 Core Packs Ready")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, reports.map(([ic, t, d, b, a1, a2, c]) => /*#__PURE__*/React.createElement("div", {
    key: t,
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'center',
      padding: 14,
      background: 'var(--surface-sunken)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 8,
      background: c === 'gold' ? 'var(--gold-700)' : c === 'navy' ? 'var(--brand-secondary)' : 'var(--brand-primary)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ic,
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 14px var(--font-sans)'
    }
  }, t), /*#__PURE__*/React.createElement(Badge, {
    tone: b[0]
  }, b[1])), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-secondary)',
      marginTop: 4
    }
  }, d)), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    size: "sm"
  }, a1), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "download"
  }, a2)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    icon: "mail-check",
    title: "Automated Dispatch",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "success"
    }, "Active Engine")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, [['Robert Johnson Trust', '12 Waterfront Units', 'Monthly, 5th'], ['Vance Family Trust', '18 Gables Estates', 'Monthly, 1st']].map(([a, b, c]) => /*#__PURE__*/React.createElement("div", {
    key: a,
    style: {
      display: 'flex',
      padding: 12,
      border: '1px solid var(--border-default)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 13px var(--font-sans)'
    }
  }, a), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, b)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px var(--font-sans)',
      color: 'var(--brand-primary)'
    }
  }, c))))), /*#__PURE__*/React.createElement(Card, {
    accent: "gold",
    icon: "badge-check",
    title: "Compliance Shield",
    action: /*#__PURE__*/React.createElement(Badge, {
      tone: "premium"
    }, "Level-3 Audit")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12,
      background: 'var(--surface-sunken)',
      borderRadius: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: 'var(--type-small)',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, "CPA Audit Readiness Score"), /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--green-700)',
      fontWeight: 500
    }
  }, "100% Verified")), /*#__PURE__*/React.createElement(ProgressBar, {
    value: 1,
    color: "green",
    height: 6
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "key-round",
    fullWidth: true
  }, "Authorize CPA Direct Access")))));
}
window.Reports = Reports;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mghpm-enterprise/Reports.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mghpm-enterprise/Shared.jsx
try { (() => {
const {
  Button,
  Badge,
  Avatar,
  Card,
  Icon,
  TextField,
  SelectField,
  Checkbox,
  RadioCard,
  StatCard,
  ProgressBar,
  DataTable,
  Breadcrumbs,
  Stepper,
  FilterTabs
} = window.MGHPMDesignSystem_f42280;
function PageHeader({
  crumbs,
  title,
  subtitle,
  badge,
  actions,
  uppercase
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 24,
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: '1 1 420px',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Breadcrumbs, {
    items: crumbs,
    uppercase: uppercase
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '8px 0 6px',
      font: 'var(--type-page-title)',
      color: 'var(--text-heading)',
      textWrap: 'pretty'
    }
  }, title), badge && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, badge), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      color: 'var(--text-secondary)',
      maxWidth: 620
    }
  }, subtitle)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap'
    }
  }, actions));
}
function Photo({
  h = 48,
  w = 64,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: w,
      height: h,
      borderRadius: 8,
      background: 'var(--slate-200)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--slate-400)',
      flexShrink: 0,
      font: '400 10px var(--font-sans)'
    }
  }, label || /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 18
  }));
}
function KV({
  k,
  v,
  mono
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 11px var(--font-sans)',
      color: 'var(--text-muted)'
    }
  }, k), /*#__PURE__*/React.createElement("div", {
    style: {
      font: mono ? '500 13px var(--font-mono)' : '500 13px var(--font-sans)',
      color: 'var(--text-body)',
      marginTop: 2
    }
  }, v));
}
function Money({
  v,
  neg,
  size = 13
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 ' + size + 'px var(--font-mono)',
      color: neg ? 'var(--red-600)' : 'var(--text-heading)'
    }
  }, v);
}
const grid4 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
  gap: 16,
  marginBottom: 20
};
const split = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 300px',
  gap: 20,
  alignItems: 'start'
};
Object.assign(window, {
  PageHeader,
  Photo,
  KV,
  Money,
  grid4,
  split
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mghpm-enterprise/Shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mghpm-enterprise/WorkOrders.jsx
try { (() => {
const {
  Button,
  Badge,
  Avatar,
  Card,
  Icon,
  TextField,
  SelectField,
  Checkbox,
  RadioCard,
  StatCard,
  ProgressBar,
  DataTable,
  Breadcrumbs,
  Stepper,
  FilterTabs
} = window.MGHPMDesignSystem_f42280;
const orders = [{
  id: '#WO-2025-0428',
  tag: ['danger', 'Urgent'],
  st: ['warning', 'Owner Review'],
  t: 'AC Unit Replacement & Evaporator Coil',
  p: 'Ocean View Villa • Unit 102',
  v: 'Cool Air Solutions',
  d: 'May 12, 2025',
  amt: '$1,250.00'
}, {
  id: '#WO-2025-0429',
  tag: ['success', 'Approved'],
  st: [null, 'Dispatched'],
  t: 'Fix leak in master bathroom vanity',
  p: 'Ocean View Villa • Unit 304',
  v: 'Rapid Plumbing Services',
  d: 'May 11, 2025',
  amt: '$350.00'
}, {
  id: '#INS-8812',
  tag: ['info', 'Digital Audit'],
  st: ['warning', 'Review Req.'],
  t: 'Move-Out Condition Inspection',
  p: 'Sunset Apartments • Unit 4B',
  v: 'Carlos Vance (Inspector)',
  d: 'Today 11:30 AM',
  amt: '24 Photos'
}, {
  id: '#INS-8814',
  tag: ['neutral', 'Scheduled'],
  st: [null, 'May 15, 2025'],
  t: 'Annual Fire & Safety Compliance',
  p: 'Maple Townhomes • Units 101–112',
  v: 'Miami Municipal Code',
  d: '',
  amt: '12 Units'
}];
const quote = [['OEM Replacement 3.5 Ton Scroll Compressor & Purge Valve', '$620.00'], ['R-410A Refrigerant Recharge (8.5 lbs @ $27/lb)', '$230.00'], ['Certified Master Technician Labor (4.0 hrs @ $100/hr)', '$400.00']];
function WorkOrders() {
  const [sel, setSel] = React.useState(0);
  const [ok, setOk] = React.useState(false);
  const o = orders[sel];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PageHeader, {
    crumbs: ['MGHPM', 'Operations', 'Maintenance & Inspections'],
    title: "MGHPM \u2014 Inspections & Work Orders Master",
    subtitle: "Dispatch work orders, review digital photo evidence, approve vendor estimates, and log condition audits across active portfolios.",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      icon: "download"
    }, "Export Audit Log"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      icon: "circle-plus"
    }, "New Ticket / Inspection"))
  }), /*#__PURE__*/React.createElement("div", {
    style: grid4
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Active Work Orders",
    value: "18",
    icon: "wrench",
    iconTone: "info",
    delta: "\u2192 4 Critical",
    deltaTone: "info",
    progress: 0.65,
    progressColor: "blue"
  }), /*#__PURE__*/React.createElement(StatCard, {
    accent: true,
    label: "Pending Approvals",
    value: "4",
    icon: "hourglass",
    iconTone: "premium",
    delta: "! $3,920 Total",
    deltaTone: "warning",
    progress: 0.45,
    progressColor: "gold"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Inspections Queued",
    value: "7",
    icon: "list-checks",
    iconTone: "brand",
    delta: "Next: 2:00 PM",
    deltaTone: "warning",
    progress: 0.55,
    progressColor: "teal"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Resolved (May)",
    value: "42",
    icon: "circle-check",
    iconTone: "success",
    delta: "\u2191 98.2% SLA",
    progress: 0.92,
    progressColor: "green"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '340px minmax(0,1fr)',
      gap: 20,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: 12
  }, /*#__PURE__*/React.createElement(TextField, {
    icon: "search",
    placeholder: "Filter by ID, property, or vendor\u2026"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(FilterTabs, {
    tabs: [{
      id: 'a',
      label: 'All',
      count: 29
    }, {
      id: 'u',
      label: 'Urgent',
      count: 4
    }, {
      id: 'p',
      label: 'Pending',
      count: 4,
      tone: 'warning'
    }, {
      id: 'i',
      label: 'In Progress',
      count: 10
    }]
  }))), orders.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: w.id,
    onClick: () => setSel(i),
    style: {
      cursor: 'pointer',
      background: '#fff',
      border: '1px solid var(--border-default)',
      borderLeft: i === sel ? '3px solid var(--brand-primary)' : undefined,
      borderRadius: 12,
      padding: 14,
      boxShadow: i === sel ? 'var(--shadow-raised)' : 'var(--shadow-card)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, w.id), /*#__PURE__*/React.createElement(Badge, {
    tone: w.tag[0]
  }, w.tag[1]), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 'auto',
      font: '600 13px var(--font-sans)'
    }
  }, w.amt)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 15px/1.3 var(--font-sans)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, w.t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, w.p)), w.st[0] ? /*#__PURE__*/React.createElement(Badge, {
    tone: w.st[0]
  }, w.st[1]) : /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, w.st[1])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 10,
      padding: '8px 10px',
      background: 'var(--surface-sunken)',
      borderRadius: 6,
      font: 'var(--type-small)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "wrench",
    size: 13
  }), w.v), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, w.d))))), /*#__PURE__*/React.createElement(Card, {
    accent: "gold"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '500 11px var(--font-mono)',
      padding: '2px 6px',
      background: 'var(--slate-100)',
      borderRadius: 4
    }
  }, o.id), /*#__PURE__*/React.createElement(Badge, {
    tone: ok ? 'success' : 'warning',
    dot: true
  }, ok ? 'Approved' : 'Pending Owner Approval'), /*#__PURE__*/React.createElement(Badge, {
    tone: "danger"
  }, "High Priority")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      marginTop: 10,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      font: '600 22px/1.25 var(--font-sans)',
      color: 'var(--text-heading)'
    }
  }, o.t), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      marginTop: 6,
      font: 'var(--type-small)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 13
  }), o.p, " \u2022 Tenant: ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--text-heading)'
    }
  }, "Maria Garcia"))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-small)',
      color: 'var(--text-muted)'
    }
  }, "Estimated Quote"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '600 24px var(--font-sans)',
      color: 'var(--text-heading)'
    }
  }, "$1,250.00"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 14,
      background: 'var(--surface-sunken)',
      border: '1px solid var(--border-default)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      font: '500 13px var(--font-sans)',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 14
  }), "Inspector Diagnostic Statement"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-body)',
      color: 'var(--text-secondary)'
    }
  }, "Severe compressor internal coil failure verified during seasonal pre-summer inspection. Full outdoor compressor and interior evaporator coil replacement mandated.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '18px 0 10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      font: '500 15px var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 16
  }), "Verified Digital Photo Evidence"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 11px var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, "4 Geo-Tagged Attachments")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 10
    }
  }, ['Exterior Compressor Block', 'Evaporator Coil Freeze', 'Digital Manifold Readout', 'Manufacturer Plate'].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t
  }, /*#__PURE__*/React.createElement(Photo, {
    w: "100%",
    h: 96,
    label: 'Evidence #' + (i + 1)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px var(--font-sans)',
      marginTop: 6
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 10px var(--font-mono)',
      color: 'var(--text-muted)'
    }
  }, "May 12, 10:", 14 + i * 8, " AM EST")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      padding: 14,
      border: '1px solid var(--border-default)',
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "snowflake",
    size: 18,
    color: "var(--brand-primary)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      font: '600 15px var(--font-sans)'
    }
  }, "Cool Air Solutions LLC"), /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "COI Active through Dec 2025")), quote.map(([a, b]) => /*#__PURE__*/React.createElement("div", {
    key: a,
    style: {
      display: 'flex',
      padding: '6px 0',
      font: 'var(--type-small)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, a), /*#__PURE__*/React.createElement(Money, {
    v: b,
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      padding: '10px 0 0',
      marginTop: 6,
      borderTop: '1px solid var(--border-default)',
      font: '500 13px var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Total Authorized Quotation"), /*#__PURE__*/React.createElement(Money, {
    v: "$1,250.00",
    size: 14
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      padding: 12,
      background: 'var(--amber-50)',
      border: '1px solid var(--amber-100)',
      borderRadius: 8,
      font: 'var(--type-small)',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--amber-700)',
      fontWeight: 500
    }
  }, "Fiduciary Threshold Compliance Note"), /*#__PURE__*/React.createElement("br", null), "This work order exceeds the pre-authorized emergency maintenance threshold ($500.00). An automated approval notification was transmitted to owner Robert Johnson."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 16,
      justifyContent: 'flex-end',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Request Alternative Quote"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "Message Vendor"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger"
  }, "Decline Work Order"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "circle-check",
    onClick: () => setOk(true),
    disabled: ok
  }, ok ? 'Approved' : 'Approve $1,250.00')))));
}
window.WorkOrders = WorkOrders;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mghpm-enterprise/WorkOrders.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.RadioCard = __ds_scope.RadioCard;

__ds_ns.SelectField = __ds_scope.SelectField;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.FilterTabs = __ds_scope.FilterTabs;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.Stepper = __ds_scope.Stepper;

__ds_ns.TopBar = __ds_scope.TopBar;

})();
