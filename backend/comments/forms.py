from django import forms
from captcha.image import CaptchaField


class CommentForm(forms.Form):
    username = forms.CharField(max_length=50)
    email = forms.EmailField()
    homepage = forms.URLField(required=False)
    text = forms.CharField(widget=forms.Textarea)
    captcha = CaptchaField()
