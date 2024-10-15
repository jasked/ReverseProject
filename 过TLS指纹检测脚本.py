#方式一
#https://github.com/FlorianREGAZ/Python-Tls-Client    pip install tls-client
import tls_client
session = tls_client.Session(
    client_identifier="chrome112",
    random_tls_extension_order=True
)

res = session.get(
    "https://www.example.com/",
    headers={
        "key1": "value1",
    },
    proxy="http://user:password@host:port"
)


#方式二
from curl_cffi import requests
url = 'xxxxx'
headers = {}
res = requests.get(url,headers = headers ,impersonate = 'chrome6666')
print(res.text)


#过akamai等安全产品，完全可代替普通request使用