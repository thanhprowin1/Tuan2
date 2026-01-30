//HTTP REQUEST GETALL GETONE PUT POST DELETE
const URL_REQUEST = 'http://localhost:3000/posts'
async function GetData() {
    try {
        let res = await fetch(URL_REQUEST);
        let posts = await res.json();
        
        let body_of_table = document.getElementById('table-body')
        body_of_table.innerHTML = "";
        for (const post of posts) {
            // Kiểm tra nếu bài viết bị xoá mềm
            let rowStyle = "";
            let buttonText = "Delete";
            if (post.isDeleted === true) {
                rowStyle = "style='text-decoration: line-through; opacity: 0.6;'";
                buttonText = "Restore";
            }
            
            body_of_table.innerHTML +=
                `<tr ${rowStyle}>
                <td>${post.id}</td>
                <td>${post.title}</td>
                <td>${post.views}</td>
                <td><input type='submit' onclick='Delete(${post.id})' value='${buttonText}'/></td>
            </tr>`
        }
    } catch (error) {
        console.log(error);
    }
}
// nếu id không tồn tai -> tạo mới với ID tự tăng
//id tồn tại thì sử dụng put 
async function Save() {
    let id = document.getElementById("id_txt").value;
    let title = document.getElementById("title_txt").value;
    let views = document.getElementById("views_txt").value;
    let res;
    
    if (id.trim() === "") {
        // ID trống - tạo mới với ID tự tăng
        try {
            let postsRes = await fetch(URL_REQUEST);
            let posts = await postsRes.json();
            
            // Lọc bài chưa bị xoá và tìm maxId
            let maxId = 0;
            for (const post of posts) {
                if (post.isDeleted !== true) {
                    let postId = parseInt(post.id);
                    if (postId > maxId) {
                        maxId = postId;
                    }
                }
            }
            
            // ID mới = maxId + 1, lưu dưới dạng string
            id = String(maxId + 1);
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    
    let resAnItem = await fetch(URL_REQUEST + '/' + id);
    
    if (resAnItem.ok) {//ton tai roi - PUT
        res = await fetch(URL_REQUEST + '/' + id,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    views: views
                })
            }
        );
    } else {
        res = await fetch(URL_REQUEST,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: id,
                    title: title,
                    views: views
                })
            }
        );

    }
    if (!res.ok) {
        console.log("bi loi");
    }
    
    // Clear input fields
    document.getElementById("id_txt").value = "";
    document.getElementById("title_txt").value = "";
    document.getElementById("views_txt").value = "";
    
    GetData();
    return false;
}
async function Delete(id) {
    // Lấy bài viết hiện tại để kiểm tra trạng thái
    let postRes = await fetch(URL_REQUEST + '/' + id);
    let post = await postRes.json();
    
    // Nếu đã xoá mềm thì khôi phục, nếu chưa thì xoá mềm
    let newDeletedStatus = post.isDeleted ? false : true;
    
    let res = await fetch(URL_REQUEST + '/' + id, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            isDeleted: newDeletedStatus
        })
    });
    if (res.ok) {
        console.log(newDeletedStatus ? "xoa thanh cong" : "khoi phuc thanh cong");
        GetData();
    }
}

// COMMENTS MANAGEMENT
const URL_COMMENTS = 'http://localhost:3000/comments';

async function LoadPostsToSelect() {
    try {
        let res = await fetch(URL_REQUEST);
        let posts = await res.json();
        
        let select = document.getElementById('post_select');
        select.innerHTML = '<option value="">-- Select a post --</option>';
        
        for (const post of posts) {
            if (post.isDeleted !== true) {
                select.innerHTML += `<option value="${post.id}">${post.id} - ${post.title}</option>`;
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function LoadComments() {
    let postId = document.getElementById('post_select').value;
    
    if (postId === "") {
        document.getElementById('comments-table-body').innerHTML = "";
        return;
    }
    
    try {
        let res = await fetch(URL_COMMENTS);
        let comments = await res.json();
        
        let body = document.getElementById('comments-table-body');
        body.innerHTML = "";
        
        for (const comment of comments) {
            // Lọc comments theo postId
            if (comment.postId !== postId) {
                continue;
            }
            
            let rowStyle = "";
            let actionButtons = "";
            
            if (comment.isDeleted === true) {
                rowStyle = "style='text-decoration: line-through; opacity: 0.6;'";
                actionButtons = `<input type='submit' onclick='EditComment(${comment.id})' value='Edit'/> 
                                <input type='submit' onclick='DeleteComment(${comment.id})' value='Restore'/>`;
            } else {
                actionButtons = `<input type='submit' onclick='EditComment(${comment.id})' value='Edit'/> 
                                <input type='submit' onclick='DeleteComment(${comment.id})' value='Delete'/>`;
            }
            
            body.innerHTML += `<tr ${rowStyle}>
                <td>${comment.id}</td>
                <td>${comment.text}</td>
                <td>${actionButtons}</td>
            </tr>`;
        }
    } catch (error) {
        console.log(error);
    }
}

async function SaveComment() {
    let commentId = document.getElementById('comment_id_txt').value;
    let commentText = document.getElementById('comment_text_txt').value;
    let postId = document.getElementById('post_select').value;
    
    if (postId === "") {
        alert("Please select a post first");
        return;
    }
    
    if (commentText.trim() === "") {
        alert("Please enter comment text");
        return;
    }
    
    let res;
    
    if (commentId.trim() === "") {
        // Tạo comment mới với ID tự tăng
        try {
            let commentsRes = await fetch(URL_COMMENTS);
            let comments = await commentsRes.json();
            
            let maxId = 0;
            for (const comment of comments) {
                if (comment.isDeleted !== true) {
                    let cId = parseInt(comment.id);
                    if (cId > maxId) {
                        maxId = cId;
                    }
                }
            }
            
            commentId = String(maxId + 1);
        } catch (error) {
            console.log(error);
            return;
        }
        
        res = await fetch(URL_COMMENTS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: commentId,
                text: commentText,
                postId: postId
            })
        });
    } else {
        // Cập nhật comment
        res = await fetch(URL_COMMENTS + '/' + commentId, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: commentText
            })
        });
    }
    
    if (res.ok) {
        ClearCommentForm();
        LoadComments();
    } else {
        console.log("Error saving comment");
    }
}

async function EditComment(id) {
    try {
        let res = await fetch(URL_COMMENTS + '/' + id);
        let comment = await res.json();
        
        document.getElementById('comment_id_txt').value = comment.id;
        document.getElementById('comment_text_txt').value = comment.text;
    } catch (error) {
        console.log(error);
    }
}

async function DeleteComment(id) {
    // Lấy comment hiện tại
    let commentRes = await fetch(URL_COMMENTS + '/' + id);
    let comment = await commentRes.json();
    
    // Toggle xoá mềm
    let newDeletedStatus = comment.isDeleted ? false : true;
    
    let res = await fetch(URL_COMMENTS + '/' + id, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            isDeleted: newDeletedStatus
        })
    });
    
    if (res.ok) {
        LoadComments();
    }
}

function ClearCommentForm() {
    document.getElementById('comment_id_txt').value = "";
    document.getElementById('comment_text_txt').value = "";
}

GetData();
LoadPostsToSelect();
