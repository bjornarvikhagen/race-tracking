cer_file ="./app/emqxsl-ca.crt"
header_file="./app/src/certificate2.h"
macro_name = "CA_CERTIFICATE"

key = open(cer_file, "r")
c_file = open(header_file,"w")
c_file.write("#define " + macro_name + " \\\n")
for line in key:
    line = line.replace("\n","")
    c_line = "\"" + line + "\\n\" \\\n"
    c_file.write(c_line)
print('Certificate converted to C header file in:',header_file)
key.close()
c_file.close()
