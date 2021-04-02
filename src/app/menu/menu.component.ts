import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LoginComponent } from '../views/login/login.component';
import { RegistroComponent } from '../views/registro/registro.component';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  constructor(public auth: AuthService,
    public ngmodal: NgbModal) { }

  ngOnInit(): void {
  }

  openLogin() {
    this.ngmodal.open(LoginComponent, { size: 'lg', backdrop: 'static' });
  }

  openRegistro() {
    this.ngmodal.open(RegistroComponent, { size: 'lg', backdrop: 'static' });
  }
}
