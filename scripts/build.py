"""
Please run this in the root directory of the repository.
From the folder containing this file usage is like:
    ../
    python scripts/build.py


"""


import os, shutil
from jsmin import jsmin
from BeautifulSoup import BeautifulSoup, Tag

DEPLOY_DIRECTORY = u"deploy/"
MERGED_JS_NAME = DEPLOY_DIRECTORY + u"ptd.js"
MERGED_HTML_NAME = DEPLOY_DIRECTORY + u"ptd.html"
HTML_FILE_NAME = u"ptd.html"
FILES_TO_COPY = ("style.css","LICENSE",)
FOLDERS_TO_COPY = []#("soundmanager2","assets")

def merge_javascript():
    pass

def main():
    print "Building Processed Tower Defense Deployment Files..."
    html = open('ptd.html', 'r')

    try:
        os.mkdir(u"deploy")
        print "Created folder 'deploy'."
    except:
        pass
        
    merged_js = open(MERGED_JS_NAME, 'w')

    soup = BeautifulSoup(html.read())
    js_files = soup.findAll("script")
    for tag in js_files:
        if tag.has_key('src'):
            merged_js.write(open(tag['src'],'r').read())
    merged_js.close()
    print "Created JS %s" % MERGED_JS_NAME

    js_imports_div = soup.find(id="js_imports")
    merged_src = Tag(soup, "script")
    merged_src["src"] = u"ptd.js"
    merged_src["charset"] = "utf-8"
    merged_src["type"] = "text/javascript"
    js_imports_div.replaceWith(merged_src)
    merged_html = open(MERGED_HTML_NAME, 'w')
    merged_html.write(str(soup))
    merged_html.close()

    print "Created HTML file: %s" % MERGED_HTML_NAME

    for file in FILES_TO_COPY:
        dest = "%s%s" % (DEPLOY_DIRECTORY, file)
        shutil.copy(file, dest)
        print "Copied file %s to %s." % (file, dest)

    for folder in FOLDERS_TO_COPY:
        dest = "%s%s" % (DEPLOY_DIRECTORY, folder)
        shutil.rmtree(dest, ignore_errors=True)
        shutil.copytree(folder, dest)
        print "Copied folder %s to %s." % (folder, dest)
        

    html.close()
    print "Finished building. The files are in the deploy/ directory."
    

if __name__ == "__main__":
    main()
