import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AmigosComponent } from './views/amigos/amigos.component';
import { HomeComponent } from './views/home/home.component';
import { LoginComponent } from './views/login/login.component';
import { PerfilComponent } from './views/perfil/perfil.component';
import { RankingsComponent } from './views/rankings/rankings.component';
import { TiendaComponent } from './views/tienda/tienda.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'home', component: HomeComponent},
  {path: 'perfil', component: PerfilComponent},
  {path: 'login', component: LoginComponent},
  {path: 'tienda', component: TiendaComponent},
  {path: 'rankings', component: RankingsComponent},
  {path: 'amigos', component: AmigosComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
