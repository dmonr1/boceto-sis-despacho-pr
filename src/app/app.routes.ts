import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { Login } from './components/login/login';
import { AuthGuard } from './guards/auth-guard';
import { CargaDatos } from './pages/carga-datos/carga-datos';

export const routes: Routes = [
  { path: '', redirectTo: 'welcome', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'welcome', component: WelcomeComponent, canActivate: [AuthGuard] },
  { path: 'carga-datos', component: CargaDatos, canActivate: [AuthGuard] }
];
