import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AmigosComponent } from './views/amigos/amigos.component';
import { ComunidadComponent } from './views/comunidad/comunidad.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { PerfilComponent } from './views/perfil/perfil.component';
import { RankingsComponent } from './views/rankings/rankings.component';
import { RegistroComponent } from './views/registro/registro.component';
import { TiendaComponent } from './views/tienda/tienda.component';

const routes: Routes = [
  /* { path: '',   redirectTo: '/home', pathMatch: 'full' }, */
  {path: '', component: HomeComponent},
  {path: 'home', component: HomeComponent},
  {path: 'perfil', component: PerfilComponent},
  {path: 'login', component: LoginComponent},
  {path: 'registro', component: RegistroComponent},
  {path: 'tienda', component: TiendaComponent},
  {path: 'rankings', component: RankingsComponent},
  {path: 'amigos', component: AmigosComponent},
  {path: 'comunidad', component: ComunidadComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
