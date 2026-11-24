package com.niga.store;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

@SpringBootApplication
public class NigaApplication {
 public static void main(String[] args){SpringApplication.run(NigaApplication.class,args);}
 @Bean CommandLineRunner seedStore(JdbcTemplate jdbc,PasswordEncoder encoder,
   @Value("${app.admin.email:}") String adminEmail,
   @Value("${app.admin.password:}") String adminPassword){
  return args->{
   Long count=jdbc.queryForObject("SELECT COUNT(*) FROM products",Long.class);
   if(count!=null&&count==0){
    jdbc.update("INSERT INTO products(name,description,category,price_toman,stock,image_url,active) VALUES(?,?,?,?,?,?,TRUE)",
     "پوستر انیمه نیگا","طرح پوستر انیمه از آرشیو تصویری نیگا. قیمت را مدیر فروشگاه تعیین می‌کند.","پوستر انیمه",0L,null,"assets/images/gojo-poster.webp");
    jdbc.update("INSERT INTO products(name,description,category,price_toman,stock,image_url,active) VALUES(?,?,?,?,?,?,TRUE)",
     "قاب گوشی طرح انیمه","قاب گوشی با طرح انیمه؛ قیمت ثبت‌شده در اطلاعات قبلی فروشگاه.","اکسسوری موبایل",550000L,null,"assets/images/deku-phone.webp");
   }
   if(StringUtils.hasText(adminEmail)&&StringUtils.hasText(adminPassword)){
    String email=adminEmail.trim().toLowerCase();
    Long admins=jdbc.queryForObject("SELECT COUNT(*) FROM store_users WHERE email=?",Long.class,email);
    if(admins!=null&&admins==0)jdbc.update("INSERT INTO store_users(name,email,password_hash,role) VALUES(?,?,?,'ADMIN')","مدیر نیگا",email,encoder.encode(adminPassword));
   }
  };
 }
}