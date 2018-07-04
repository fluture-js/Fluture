import show from 'sanctuary-show';

export {show};
export function noop(){}
export function moop(){ return this }
export function padf(sf, s){ return s.replace(/^/gm, sf).replace(sf, '') }
export function showf(f){ return padf('  ', show(f)) }

export function partial1(f, a){
  return function bound1(b, c, d){
    switch(arguments.length){
      case 1: return f(a, b);
      case 2: return f(a, b, c);
      default: return f(a, b, c, d);
    }
  };
}

export function partial2(f, a, b){
  return function bound2(c, d){
    return arguments.length === 1 ? f(a, b, c) : f(a, b, c, d);
  };
}

export function partial3(f, a, b, c){
  return function bound3(d){
    return f(a, b, c, d);
  };
}

export function raise(x){
  throw x;
}

export function indent(s){
  return '  ' + s;
}
