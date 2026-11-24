package com.niga.store;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
 private final byte[] secret;private final long expirationHours;private final JsonMapper mapper;
 public JwtService(@Value("${app.jwt.secret}") String secret,
   @Value("${app.jwt.expiration-hours:24}") long expirationHours,JsonMapper mapper){
  if(secret==null||secret.getBytes(StandardCharsets.UTF_8).length<32)throw new IllegalStateException("JWT_SECRET must contain at least 32 bytes.");
  this.secret=secret.getBytes(StandardCharsets.UTF_8);this.expirationHours=Math.max(1,expirationHours);this.mapper=mapper;
 }
 public String issue(String email,String role){
  try{
   String header=encode(mapper.writeValueAsBytes(Map.of("alg","HS256","typ","JWT")));
   Map<String,Object> claims=new HashMap<>();claims.put("sub",email);claims.put("role",role);
   claims.put("iat",Instant.now().getEpochSecond());claims.put("exp",Instant.now().plusSeconds(expirationHours*3600).getEpochSecond());
   String payload=encode(mapper.writeValueAsBytes(claims));String content=header+"."+payload;
   return content+"."+encode(sign(content));
  }catch(Exception ex){throw new IllegalStateException("Could not create access token.",ex);}
 }
 public Map<String,Object> verify(String token){
  try{
   String[] parts=token.split("\\.");if(parts.length!=3)return null;
   String content=parts[0]+"."+parts[1];byte[] supplied=Base64.getUrlDecoder().decode(parts[2]);
   if(!MessageDigest.isEqual(sign(content),supplied))return null;
   Map<String,Object> header=mapper.readValue(Base64.getUrlDecoder().decode(parts[0]),new TypeReference<Map<String,Object>>(){});
   if(!"HS256".equals(header.get("alg")))return null;
   Map<String,Object> claims=mapper.readValue(Base64.getUrlDecoder().decode(parts[1]),new TypeReference<Map<String,Object>>(){});
   Object exp=claims.get("exp");if(!(exp instanceof Number)||((Number)exp).longValue()<=Instant.now().getEpochSecond())return null;
   return claims;
  }catch(Exception ex){return null;}
 }
 private byte[] sign(String value)throws Exception{Mac mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(secret,"HmacSHA256"));return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));}
 private static String encode(byte[] bytes){return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);}
}