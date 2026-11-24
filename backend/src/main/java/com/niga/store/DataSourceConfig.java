package com.niga.store;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class DataSourceConfig {
 @Bean DataSource dataSource(Environment env){
  String databaseUrl=env.getProperty("DATABASE_URL","").trim();
  HikariConfig c=new HikariConfig();c.setMaximumPoolSize(8);c.setPoolName("niga-store-pool");
  if(!databaseUrl.isBlank()){
   if(databaseUrl.startsWith("postgres://")||databaseUrl.startsWith("postgresql://")){
    URI uri=URI.create(databaseUrl.replaceFirst("^postgres://","postgresql://"));
    String[] credentials=uri.getRawUserInfo()==null?new String[]{"",""}:uri.getRawUserInfo().split(":",2);
    String username=URLDecoder.decode(credentials[0],StandardCharsets.UTF_8);
    String password=credentials.length>1?URLDecoder.decode(credentials[1],StandardCharsets.UTF_8):"";
    c.setJdbcUrl("jdbc:postgresql://"+uri.getHost()+(uri.getPort()>0?":"+uri.getPort():"")+uri.getPath()+"?sslmode=require");
    c.setUsername(username);c.setPassword(password);c.setDriverClassName("org.postgresql.Driver");
   }else{c.setJdbcUrl(databaseUrl);c.setDriverClassName("org.postgresql.Driver");}
  }else{
   String jdbcUrl=env.getProperty("SPRING_DATASOURCE_URL","jdbc:h2:mem:niga;MODE=PostgreSQL;DB_CLOSE_DELAY=-1");
   c.setJdbcUrl(jdbcUrl);c.setUsername(env.getProperty("SPRING_DATASOURCE_USERNAME","sa"));c.setPassword(env.getProperty("SPRING_DATASOURCE_PASSWORD",""));
   if(jdbcUrl.startsWith("jdbc:h2:"))c.setDriverClassName("org.h2.Driver");
  }
  return new HikariDataSource(c);
 }
}