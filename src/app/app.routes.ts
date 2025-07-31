import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { Login } from './components/login/login';
import { AuthGuard } from './guards/auth-guard';
import { CargaDatos } from './pages/carga-datos/carga-datos';
import { ListaClientes } from './pages/lista-clientes/lista-clientes';
import { ClienteHardware } from './pages/cliente-hardware/cliente-hardware';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'welcome', component: WelcomeComponent, canActivate: [AuthGuard] },
  { path: 'carga-datos', component: CargaDatos, canActivate: [AuthGuard] },
  { path: 'lista-clientes', component: ListaClientes, canActivate: [AuthGuard] },
  { path: 'cliente-hardware', component: ClienteHardware, canActivate: [AuthGuard] },
  { path: 'dashboard/:tipo/:id', component: ListaClientes, canActivate: [AuthGuard] }, // 👈 nueva ruta
];
