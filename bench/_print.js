'use strict'

module.exports = function print(){

  for(let i = 0; i < this.length; i++){
    console.log(this[i].toString());
  }

  console.log('Fastest is', this.filter('fastest').map('name')[0]);

};