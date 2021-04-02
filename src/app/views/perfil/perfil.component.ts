import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { PerfilService } from 'src/app/services/perfil.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {

  constructor(public auth: AuthService,
    public perfilService: PerfilService,
    public toastr: ToastrService) {
  }

  ngOnInit(): void {    
    this.auth.getUser();
  }

  saveImg(url: any) {
    this.perfilService.uploadImgBD(url)
      .then(success => {
        this.toastr.success('Foto actualizada con éxito', 'Foto')
      })
  }

}
