import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroAmigos'
})
export class FiltroAmigosPipe implements PipeTransform {

  transform(value: any, arg: any): any {
    if(arg === '') return value;
    const amigosFilter = [];
    for(const amigo of value) {     
      var amigoF = amigo.displayName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      var busqueda = arg.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if(amigoF.indexOf(busqueda) > -1) {
        amigosFilter.push(amigo);
      }
    }
    return amigosFilter;
  }

}
