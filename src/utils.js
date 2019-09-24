export const getUrlParams = function () {
  var list = window.location.href.match(/[?&][^=]*=[^?&=]*/g) || []
  return list.reduce((params, str) => {
    let [key, value] = str.slice(1).split('=')
    params[key] = value
    return params
  }, {})
}