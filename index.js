/**
 * Created by django on 22/07/16.
 */

var fs = require('fs');
var JSFtp = require("jsftp");
var unzip = require('unzip');
var xml2js = require('xml2js');
var Combinatronics = require('./combinatronics.js');

var nodes =[]
var links = []

var opts = {host:'ftp.sagepub.co.uk',user:'contentcollection', pass:'sage#Collection'}
var ftp = new JSFtp(opts)


ftp.ls(".", function(err, res) {
    var lst = []
    res.forEach(function(file) {
        lst.push(file.name)
    });
    //getZip([])
    console.log("found " +lst.length + " files")
    console.log(lst.toString());
    console.log("starting the download, this may take up to some minutes...")
    getZip(lst);
});

//get my files
function getZip(list) {

    if(list.length) {

        ftp.get(list[0], 'data/'+list[0], function(hadErr) {
            if (hadErr)
                console.error('There was an error retrieving the file.');
            else
                console.log(list[0]+' copied successfully');
            
            list.shift();
            getZip(list);

        });
    }
        
    else {
        ftp.raw.quit();
        console.log("done downloading");
        unzipFiles();
    }
}

//unzip them
function unzipFiles() {
    console.log("unzipping files...")
    var ls = fs.readdirSync("data");
    ls.forEach(function(d){
        if(d.indexOf(".zip")>0) {
            fs.createReadStream("data/" + d).pipe(unzip.Extract({path: d.indexOf("pap") >= 0 ? 'data/pap' : 'data/issued'}));
        }
    })

    analyzeFiles();
}

//analyze xmls
function analyzeFiles() {

    console.log("retrieving content...")

    var fl = [];
    fl = walkSync("data/",fl);
    
    function readFile(ls) {
        
        if(ls.length) {

            var currFile = fs.readFileSync(ls[0]);
            ls.shift();
            xml2js.parseString(currFile, function (err, result) {
                try {
                    var currkeys = result.article.front[0]['article-meta'][0]['kwd-group'][0]['kwd']
                    updateNodes(currkeys);
                    updateLinks(currkeys);
                }
                catch(e) {
                    console.log(e);
                }
                
                readFile(ls);
                
            });
        }
        
        else {
            generateHtml();
        }
    }

    readFile(fl);

}


function updateNodes(arr) {

    arr.forEach(function(d){
        var found = nodes.filter(function(e){return e.name == d})
        if(found.length) {
            found[0].size = found[0].size+1;
        }

        else nodes.push({name:d, size:1})
    })
}

function updateLinks(arr) {

    var cmb = Combinatronics.combination(arr,2)
    while(a = cmb.next()) {

        var found = links.filter(function(e){return (e.source == a[0] && e.target == a[1]) || (e.target == a[0] && e.source == a[1])})

        if(found.length) {
            found[0].size = found[0].value+1;
        }

        else links.push({source:a[0], target:a[1], value:1})
    }
}


function generateHtml() {

    console.log("generating the banner html file...")

    var first = fs.readFileSync('banner1sthalf').toString()
    var second = fs.readFileSync('banner2ndhalf').toString()

    var graph = {nodes:nodes, links:links}

    var complete = first + "\n var graph = " + JSON.stringify(graph) + "; \n"+second;

    fs.writeFileSync("generated.html", complete);

    if(process.argv.length>4) {
        sendResult();
    }



}


function walkSync(dir, filelist) {
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(dir + file).isDirectory()) {
            filelist = walkSync(dir + file + '/', filelist);
        }
        else {
            if(file.indexOf(".xml")>0) {
                filelist.push(dir+file);
            }
        }
    });
    return filelist;
};



function sendResult() {

    console.log("sending email...")

    var nodemailer = require('nodemailer');
    var transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.argv[2],
            pass: process.argv[3]
        }
    });


    var mailOptions = {
        from: '"DensityDesign" <densitydesign@gmail.com>', // sender address
        to: process.argv[4], // list of receivers
        subject: 'BDS banner - updated at '+ new Date().toDateString(), // Subject line
        text: 'Hi, \n this is an automated message. You can find attached the latest version of the Big Data & Society banner. For issues and comunications, you can answer to this mail. \n\n Best regards,\n The DensityDesign team', // plaintext body
        html: '<p>Hi,<br/> this is an automated message. You can find attached the latest version of the Big Data & Society banner. For issues and comunications, you can answer to this mail. <br/><br/> Best regards,<br/> The DensityDesign team</p>', // html body
        attachments: [

            {   // file on disk as an attachment
                filename: 'bds_banner.html',
                path: 'generated.html' // stream this file
            }
        ]
    };

    transport.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });

}

