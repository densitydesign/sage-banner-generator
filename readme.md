Big Data and Society dynamic logo generator
=======

###Description and usage
This routine automatically generates an html banner containing the dynamic logo for the Big Data and Society publications. It works by downloading the latest collection of papers, analyzing the keywords and returning a web visualization in a self-contained HTML file called *bds_banner.html*.

To start using it, you must first collect the project dipendencies with npm:

```
npm install
```

You can then call the routine by using node:

```
node index.js
```

###Sending the banner as attachment


If you also provide your mail account and a set of recipients, it will also send the file as attachment. Specifically, you should call the routine like this:

```
node index.js mymail@gmail.com mypassword recipient@recipientdomain.com
```

at this time, only gmail accounts can be used to send the mail.

###Disclaimer
Please note that inside the code you can find **username** and **password** of the **BDS ftp account**. As such, this repository should remain **private.**
